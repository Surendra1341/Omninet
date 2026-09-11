package org.zemo.omninet.ai.provider;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AiProviderFactory {

    private final GeminiAiProvider geminiAiProvider;
    private final OllamaAiProvider ollamaAiProvider;

    @Value("${ai.provider:ollama}")
    private String preferredProvider;

    public AiProvider getProvider() {
        if ("gemini".equalsIgnoreCase(preferredProvider)) {
            return geminiAiProvider;
        }
        return ollamaAiProvider;
    }
}
