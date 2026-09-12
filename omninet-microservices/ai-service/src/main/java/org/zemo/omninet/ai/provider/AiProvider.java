package org.zemo.omninet.ai.provider;

import org.zemo.omninet.ai.entity.ChatMessage;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.function.Consumer;

public interface AiProvider {
    String getProviderName();

    default String generateText(String prompt, List<ChatMessage> history) {
        return generateTextWithCitations(prompt, history, null, false).text();
    }

    GenResult generateTextWithCitations(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled);

    void streamText(String prompt, List<ChatMessage> history, String systemInstruction, boolean webSearchEnabled, Consumer<StreamEvent> consumer);

    record GenResult(
            String text,
            List<Map<String, String>> citations,
            String modelUsed
    ) {}

    record StreamEvent(
            String type,      // "status", "token", "citations", "done", "error"
            String data,      // text token or status message
            Object payload    // optional structured data (e.g. citations list)
    ) {}
}
