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

import java.util.*;

@Component
@Slf4j
public class GeminiAiProvider implements AiProvider {

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return "gemini";
    }

    @Override
    public String generateText(String prompt, List<ChatMessage> history) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("Gemini API key is not configured");
            return "Gemini API key not configured. Please set GEMINI_API_KEY environment variable.";
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + apiKey;

        try {
            List<Map<String, Object>> contents = new ArrayList<>();

            // Add history if present
            if (history != null) {
                for (ChatMessage msg : history) {
                    String role = (msg.getType() == ChatMessage.MessageType.USER_TEXT || msg.getType() == ChatMessage.MessageType.USER_AUDIO)
                            ? "user" : "model";
                    contents.add(Map.of(
                            "role", role,
                            "parts", List.of(Map.of("text", msg.getContent() != null ? msg.getContent() : ""))
                    ));
                }
            }

            // Add current prompt
            contents.add(Map.of(
                    "role", "user",
                    "parts", List.of(Map.of("text", prompt))
            ));

            Map<String, Object> requestBody = Map.of("contents", contents);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode root = objectMapper.readTree(response.getBody());
                JsonNode candidates = root.path("candidates");
                if (candidates.isArray() && !candidates.isEmpty()) {
                    JsonNode textNode = candidates.get(0).path("content").path("parts").get(0).path("text");
                    return textNode.asText();
                }
            }

            return "Unable to parse response from Gemini.";
        } catch (Exception e) {
            log.error("Gemini API invocation failed: {}", e.getMessage());
            return "Error calling Gemini: " + e.getMessage();
        }
    }
}
