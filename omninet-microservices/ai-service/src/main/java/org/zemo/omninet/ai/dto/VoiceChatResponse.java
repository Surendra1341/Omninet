package org.zemo.omninet.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoiceChatResponse {
    private String textResponse;
    private String audioBase64;
    private String audioFilePath;
    private Long sessionId;
}
