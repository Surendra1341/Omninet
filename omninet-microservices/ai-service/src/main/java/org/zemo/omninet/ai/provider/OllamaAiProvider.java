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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class OllamaAiProvider implements AiProvider {

    @Value("${ollama.url:http://localhost:11434}")
    private String ollamaUrl;

    @Value("${ollama.model:llama3.2}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public String getProviderName() {
        return "ollama";
    }

    @Override
    public String generateText(String prompt, List<ChatMessage> history) {
        String url = ollamaUrl + "/api/generate";

        try {
            StringBuilder fullPrompt = new StringBuilder();
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
                return root.path("response").asText();
            }

            return "Ollama returned an empty response.";
        } catch (Exception e) {
            log.warn("Ollama call failed (Ollama service may not be running locally: {}). Returning fallback answer.", e.getMessage());
            return "Hello! I am your OmniNet AI Assistant. I received: \"" + prompt + "\". (To connect live LLMs, configure Ollama or GEMINI_API_KEY in ai-service).";
        }
    }
}
