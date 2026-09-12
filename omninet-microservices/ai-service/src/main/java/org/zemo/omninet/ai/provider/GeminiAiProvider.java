package org.zemo.omninet.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestTemplate;
import org.zemo.omninet.ai.entity.ChatMessage;
import org.zemo.omninet.ai.tools.AiTool;
import org.zemo.omninet.ai.tools.ToolRegistry;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Consumer;

@Component("geminiProvider")
@Slf4j
public class GeminiAiProvider implements AiProvider {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.7-flash}")
    private String defaultModel;

    @Value("${gemini.backup-models:gemini-flash-latest,gemini-3.5-flash,gemini-3.6-flash}")
    private String backupModelsConfig;

    private final ToolRegistry toolRegistry;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeminiAiProvider(ToolRegistry toolRegistry) {
        this.toolRegistry = toolRegistry;
    }

    @Override
    public String getProviderName() {
        return "gemini (" + defaultModel + ")";
    }

    private List<String> getModelCandidates() {
        List<String> list = new ArrayList<>();
        if (defaultModel != null && !defaultModel.isBlank()) {
            list.add(defaultModel.trim());
        }
        if (backupModelsConfig != null && !backupModelsConfig.isBlank()) {
            for (String bm : backupModelsConfig.split(",")) {
                String m = bm.trim();
                if (!m.isEmpty() && !list.contains(m)) {
                    list.add(m);
                }
            }
        }
        return list;
    }

    @Override
    public GenResult generateTextWithCitations(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled) {
        if (apiKey == null || apiKey.isBlank()) {
            return new GenResult("Gemini API key is not configured.", Collections.emptyList(), "none");
        }

        List<String> models = getModelCandidates();
        Exception lastException = null;

        for (String model : models) {
            try {
                GenResult res = executeGenerateContentWithRetry(model, prompt, history, systemInstruction, webSearchEnabled);
                if (res != null && res.text() != null && !res.text().isBlank()) {
                    return res;
                }
            } catch (Exception e) {
                log.warn("Gemini model {} failed: {}. Trying fallback model...", model, e.getMessage());
                lastException = e;
            }
        }

        return new GenResult("Unable to generate response from Gemini: " + (lastException != null ? lastException.getMessage() : "Unknown error"), Collections.emptyList(), "gemini-error");
    }

    private GenResult executeGenerateContentWithRetry(String model, String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled) throws Exception {
        int maxRetries = 2;
        long backoffMs = 1000;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return executeGenerateContent(model, prompt, history, systemInstruction, webSearchEnabled);
            } catch (HttpClientErrorException.TooManyRequests | HttpServerErrorException e) {
                if (attempt == maxRetries) throw e;
                log.warn("Gemini rate limit/server error on {} (attempt {}/{}). Retrying in {}ms...", model, attempt, maxRetries, backoffMs);
                Thread.sleep(backoffMs);
                backoffMs *= 2;
            }
        }
        throw new IllegalStateException("Max retries exceeded for Gemini model " + model);
    }

    @SuppressWarnings("unchecked")
    private GenResult executeGenerateContent(String model, String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled) throws Exception {
        String baseUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + apiKey;

        List<Map<String, Object>> contents = buildConversationContents(prompt, history);
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("contents", contents);

        if (systemInstruction != null && !systemInstruction.isBlank()) {
            requestBody.put("systemInstruction", Map.of(
                    "parts", List.of(Map.of("text", systemInstruction))
            ));
        }

        if (webSearchEnabled) {
            requestBody.put("tools", toolRegistry.getGeminiToolsDeclaration());
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(baseUrl, entity, String.class);
        JsonNode root = objectMapper.readTree(response.getBody());
        JsonNode candidates = root.path("candidates");

        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("Gemini returned no candidates for model " + model);
        }

        JsonNode firstCandidate = candidates.get(0);
        JsonNode parts = firstCandidate.path("content").path("parts");

        List<Map<String, String>> citations = new ArrayList<>();

        if (parts.isArray() && !parts.isEmpty()) {
            JsonNode functionPart = null;
            for (JsonNode p : parts) {
                if (p.has("functionCall")) {
                    functionPart = p;
                    break;
                }
            }

            if (functionPart != null) {
                JsonNode functionCall = functionPart.get("functionCall");
                String fnName = functionCall.path("name").asText();
                Map<String, Object> fnArgs = objectMapper.convertValue(functionCall.path("args"), Map.class);

                AiTool.ToolResult toolResult = toolRegistry.executeTool(fnName, fnArgs);
                if (toolResult.structuredData() instanceof List) {
                    citations.addAll((List<Map<String, String>>) toolResult.structuredData());
                }

                // Step 2: Feed back function response to Gemini with exact model part
                contents.add(Map.of("role", "model", "parts", List.of(objectMapper.convertValue(functionPart, Map.class))));

                Map<String, Object> fnResponseMap = new HashMap<>();
                fnResponseMap.put("name", fnName);
                fnResponseMap.put("response", Map.of("result", toolResult.content()));
                if (functionCall.has("id")) {
                    fnResponseMap.put("id", functionCall.get("id").asText());
                }

                contents.add(Map.of("role", "user", "parts", List.of(Map.of(
                        "functionResponse", fnResponseMap
                ))));

                Map<String, Object> step2Body = new HashMap<>(requestBody);
                step2Body.put("contents", contents);

                HttpEntity<Map<String, Object>> step2Entity = new HttpEntity<>(step2Body, headers);
                ResponseEntity<String> step2Response = restTemplate.postForEntity(baseUrl, step2Entity, String.class);

                JsonNode step2Root = objectMapper.readTree(step2Response.getBody());
                JsonNode step2Candidates = step2Root.path("candidates");
                if (step2Candidates.isArray() && !step2Candidates.isEmpty()) {
                    JsonNode step2Parts = step2Candidates.get(0).path("content").path("parts");
                    StringBuilder answerBuilder = new StringBuilder();
                    if (step2Parts.isArray()) {
                        for (JsonNode sp : step2Parts) {
                            if (sp.has("text")) {
                                answerBuilder.append(sp.get("text").asText());
                            }
                        }
                    }
                    String answer = answerBuilder.toString().trim();
                    if (!answer.isEmpty()) {
                        return new GenResult(answer, citations, model);
                    }
                }
            } else {
                StringBuilder textBuilder = new StringBuilder();
                for (JsonNode p : parts) {
                    if (p.has("text")) {
                        textBuilder.append(p.get("text").asText());
                    }
                }
                String text = textBuilder.toString().trim();
                if (!text.isEmpty()) {
                    return new GenResult(text, citations, model);
                }
            }
        }

        throw new RuntimeException("Gemini returned empty text response on " + model);
    }

    @Override
    public void streamText(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled, Consumer<StreamEvent> consumer) {
        if (apiKey == null || apiKey.isBlank()) {
            consumer.accept(new StreamEvent("error", "Gemini API key is not configured.", null));
            return;
        }

        List<String> models = getModelCandidates();
        boolean success = false;

        for (String model : models) {
            try {
                executeStreamContent(model, prompt, history, systemInstruction, webSearchEnabled, consumer);
                success = true;
                break;
            } catch (Exception e) {
                log.warn("Streaming with Gemini model {} failed: {}. Trying fallback...", model, e.getMessage());
            }
        }

        if (!success) {
            consumer.accept(new StreamEvent("error", "AI streaming failed across all available Gemini models.", null));
        }
    }

    private void executeStreamContent(String model, String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled, Consumer<StreamEvent> consumer) throws Exception {
        List<Map<String, Object>> contents = buildConversationContents(prompt, history);

        // If web search is enabled, execute grounding resolution first
        if (webSearchEnabled) {
            consumer.accept(new StreamEvent("status", "Searching web & analyzing context...", null));
            try {
                GenResult genResult = executeGenerateContent(model, prompt, history, systemInstruction, true);
                if (genResult.text() != null && !genResult.text().isBlank()) {
                    if (!genResult.citations().isEmpty()) {
                        consumer.accept(new StreamEvent("citations", "", genResult.citations()));
                    }

                    // Stream answer word by word for smooth reading experience
                    String[] words = genResult.text().split("(?<=\\s)|(?=\\n)");
                    for (String word : words) {
                        consumer.accept(new StreamEvent("token", word, null));
                        Thread.sleep(10);
                    }
                    consumer.accept(new StreamEvent("done", genResult.text(), null));
                    return;
                }
            } catch (Exception e) {
                log.warn("Web search grounding on {} failed ({}). Falling back to direct streaming...", model, e.getMessage());
            }
        }

        // Direct SSE streaming via streamGenerateContent without function calling
        Map<String, Object> streamBody = new HashMap<>();
        streamBody.put("contents", contents);
        if (systemInstruction != null && !systemInstruction.isBlank()) {
            streamBody.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))));
        }

        String sseUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":streamGenerateContent?alt=sse&key=" + apiKey;

        URL url = new URL(sseUrl);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json");
        conn.setDoOutput(true);
        conn.setConnectTimeout(10000);
        conn.setReadTimeout(30000);

        String jsonPayload = objectMapper.writeValueAsString(streamBody);
        try (OutputStream os = conn.getOutputStream()) {
            os.write(jsonPayload.getBytes(StandardCharsets.UTF_8));
        }

        int status = conn.getResponseCode();
        if (status >= 400) {
            throw new RuntimeException("Gemini streaming returned HTTP " + status);
        }

        StringBuilder fullText = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (line.startsWith("data: ")) {
                    String dataJson = line.substring(6).trim();
                    if (!dataJson.isEmpty()) {
                        try {
                            JsonNode chunkNode = objectMapper.readTree(dataJson);
                            JsonNode candidates = chunkNode.path("candidates");
                            if (candidates.isArray() && !candidates.isEmpty()) {
                                JsonNode parts = candidates.get(0).path("content").path("parts");
                                if (parts.isArray() && !parts.isEmpty()) {
                                    for (JsonNode part : parts) {
                                        if (part.has("text")) {
                                            String token = part.get("text").asText();
                                            fullText.append(token);
                                            consumer.accept(new StreamEvent("token", token, null));
                                        }
                                    }
                                }
                            }
                        } catch (Exception parseErr) {
                            log.debug("Chunk parse skip: {}", parseErr.getMessage());
                        }
                    }
                }
            }
        }

        String completed = fullText.toString().trim();
        if (completed.isEmpty()) {
            throw new RuntimeException("Gemini direct stream completed with empty text.");
        }

        consumer.accept(new StreamEvent("done", completed, null));
    }

    private List<Map<String, Object>> buildConversationContents(String prompt, List<ChatMessage> history) {
        List<Map<String, Object>> contents = new ArrayList<>();
        String lastRole = null;
        StringBuilder lastText = new StringBuilder();

        if (history != null) {
            for (ChatMessage msg : history) {
                String content = msg.getContent();
                if (content == null || content.trim().isEmpty()) {
                    continue; // Skip empty messages entirely
                }
                String role = (msg.getType() == ChatMessage.MessageType.USER_TEXT || msg.getType() == ChatMessage.MessageType.USER_AUDIO)
                        ? "user" : "model";

                if (role.equals(lastRole)) {
                    lastText.append("\n\n").append(content.trim());
                } else {
                    if (lastRole != null) {
                        contents.add(Map.of(
                                "role", lastRole,
                                "parts", List.of(Map.of("text", lastText.toString()))
                        ));
                    }
                    lastRole = role;
                    lastText = new StringBuilder(content.trim());
                }
            }
        }

        // Append the current user prompt ensuring strict alternation
        if ("user".equals(lastRole)) {
            lastText.append("\n\n").append(prompt.trim());
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", lastText.toString()))
            ));
        } else {
            if (lastRole != null) {
                contents.add(Map.of(
                        "role", lastRole,
                        "parts", List.of(Map.of("text", lastText.toString()))
                ));
            }
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt.trim()))
            ));
        }

        return contents;
    }
}
