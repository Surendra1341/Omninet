package org.zemo.omninet.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatResponse {
    private String response;
    private Long sessionId;
    private String model;
    private int tokensUsed;
    private List<Map<String, String>> citations;
    private ChatMessageDto userMessage;
    private ChatMessageDto aiMessage;
}
