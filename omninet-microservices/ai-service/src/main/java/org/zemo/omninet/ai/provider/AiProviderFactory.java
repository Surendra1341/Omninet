package org.zemo.omninet.ai.provider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;
import org.zemo.omninet.ai.entity.ChatMessage;

import java.util.List;
import java.util.function.Consumer;

@Component
@Primary
@RequiredArgsConstructor
@Slf4j
public class AiProviderFactory implements AiProvider {

    private final GeminiAiProvider geminiAiProvider;
    private final OllamaAiProvider ollamaAiProvider;

    @Value("${ai.provider:gemini}")
    private String preferredProvider;

    @Override
    public String getProviderName() {
        return "gemini".equalsIgnoreCase(preferredProvider) ? geminiAiProvider.getProviderName() : ollamaAiProvider.getProviderName();
    }

    public AiProvider getProvider() {
        return this;
    }

    @Override
    public GenResult generateTextWithCitations(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled) {
        if ("gemini".equalsIgnoreCase(preferredProvider)) {
            try {
                GenResult res = geminiAiProvider.generateTextWithCitations(prompt, history, systemInstruction, webSearchEnabled);
                if (res != null && !"gemini-error".equals(res.modelUsed())) {
                    return res;
                }
                log.warn("Gemini provider returned error. Failing over to Ollama...");
            } catch (Exception e) {
                log.warn("Gemini call failed with exception: {}. Failing over to Ollama...", e.getMessage());
            }
            // Failover to Ollama
            return ollamaAiProvider.generateTextWithCitations(prompt, history, systemInstruction, webSearchEnabled);
        } else {
            try {
                GenResult res = ollamaAiProvider.generateTextWithCitations(prompt, history, systemInstruction, webSearchEnabled);
                if (res != null && !"fallback-engine".equals(res.modelUsed())) {
                    return res;
                }
                log.warn("Ollama returned fallback. Failing over to Gemini...");
            } catch (Exception e) {
                log.warn("Ollama failed: {}. Failing over to Gemini...", e.getMessage());
            }
            return geminiAiProvider.generateTextWithCitations(prompt, history, systemInstruction, webSearchEnabled);
        }
    }

    @Override
    public void streamText(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled, Consumer<StreamEvent> consumer) {
        if ("gemini".equalsIgnoreCase(preferredProvider)) {
            try {
                geminiAiProvider.streamText(prompt, history, systemInstruction, webSearchEnabled, event -> {
                    if ("error".equals(event.type())) {
                        log.warn("Gemini stream error. Failing over to Ollama streaming...");
                        ollamaAiProvider.streamText(prompt, history, systemInstruction, webSearchEnabled, consumer);
                    } else {
                        consumer.accept(event);
                    }
                });
            } catch (Exception e) {
                log.warn("Gemini streaming invocation failed: {}. Failing over to Ollama...", e.getMessage());
                ollamaAiProvider.streamText(prompt, history, systemInstruction, webSearchEnabled, consumer);
            }
        } else {
            ollamaAiProvider.streamText(prompt, history, systemInstruction, webSearchEnabled, consumer);
        }
    }
}
