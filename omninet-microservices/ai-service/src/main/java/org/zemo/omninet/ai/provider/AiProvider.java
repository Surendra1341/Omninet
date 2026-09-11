package org.zemo.omninet.ai.provider;

import org.zemo.omninet.ai.entity.ChatMessage;

import java.util.List;

public interface AiProvider {
    String generateText(String prompt, List<ChatMessage> history);
    String getProviderName();
}
