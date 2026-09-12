package org.zemo.omninet.ai.provider;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.zemo.omninet.ai.entity.ChatMessage;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Consumer;

@Component
@Slf4j
public class OllamaAiProvider implements AiProvider {

    @Value("${ollama.url:http://host.docker.internal:11434}")
    private String ollamaUrl;

    @Value("${ollama.model:deepseek-coder:6.7b}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return "ollama";
    }

    @Override
    public GenResult generateTextWithCitations(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled) {
        String url = ollamaUrl + "/api/generate";

        try {
            StringBuilder fullPrompt = new StringBuilder();
            if (systemInstruction != null && !systemInstruction.isBlank()) {
                fullPrompt.append("System: ").append(systemInstruction).append("\n\n");
            }
            if (history != null && !history.isEmpty()) {
                for (ChatMessage msg : history) {
                    String role = (msg.getType() == ChatMessage.MessageType.USER_TEXT || msg.getType() == ChatMessage.MessageType.USER_AUDIO)
                            ? "User: " : "Assistant: ";
                    fullPrompt.append(role).append(msg.getContent()).append("\n");
                }
            }
            fullPrompt.append("User: ").append(prompt).append("\nAssistant: ");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("prompt", fullPrompt.toString());
            requestBody.put("stream", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                String answer = root.path("response").asText();
                return new GenResult(answer, Collections.emptyList(), "ollama:" + modelName);
            }

            return new GenResult("Ollama returned an empty response.", Collections.emptyList(), "ollama:" + modelName);
        } catch (Exception e) {
            log.warn("Ollama call failed: {}. Returning resilient fallback answer.", e.getMessage());
            return new GenResult(
                    "Hello! I am your OmniNet AI Assistant. I received your message: \"" + prompt + "\".",
                    Collections.emptyList(),
                    "fallback-engine"
            );
        }
    }

    @Override
    public void streamText(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled, Consumer<StreamEvent> consumer) {
        String urlStr = ollamaUrl + "/api/generate";

        try {
            StringBuilder fullPrompt = new StringBuilder();
            if (systemInstruction != null && !systemInstruction.isBlank()) {
                fullPrompt.append("System: ").append(systemInstruction).append("\n\n");
            }
            if (history != null && !history.isEmpty()) {
                for (ChatMessage msg : history) {
                    String role = (msg.getType() == ChatMessage.MessageType.USER_TEXT || msg.getType() == ChatMessage.MessageType.USER_AUDIO)
                            ? "User: " : "Assistant: ";
                    fullPrompt.append(role).append(msg.getContent()).append("\n");
                }
            }
            fullPrompt.append("User: ").append(prompt).append("\nAssistant: ");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("prompt", fullPrompt.toString());
            requestBody.put("stream", true);

            URL url = new URL(urlStr);
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setDoOutput(true);
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(30000);

            try (OutputStream os = conn.getOutputStream()) {
                os.write(objectMapper.writeValueAsString(requestBody).getBytes(StandardCharsets.UTF_8));
            }

            StringBuilder fullText = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (!line.isBlank()) {
                        JsonNode node = objectMapper.readTree(line);
                        String token = node.path("response").asText();
                        if (!token.isEmpty()) {
                            fullText.append(token);
                            consumer.accept(new StreamEvent("token", token, null));
                        }
                    }
                }
            }
            consumer.accept(new StreamEvent("done", fullText.toString(), null));
        } catch (Exception e) {
            log.warn("Ollama streaming error: {}", e.getMessage());
            GenResult fallback = generateTextWithCitations(prompt, history, systemInstruction, false);
            consumer.accept(new StreamEvent("token", fallback.text(), null));
            consumer.accept(new StreamEvent("done", fallback.text(), null));
        }
    }
}
