package org.zemo.omninet.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SpeechRecognizeResponse {
    private String text;
    private double confidence;
    private boolean success;
}
