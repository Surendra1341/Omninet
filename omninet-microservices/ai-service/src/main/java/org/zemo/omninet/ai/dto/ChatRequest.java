package org.zemo.omninet.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatRequest {

    @NotBlank(message = "Prompt cannot be blank")
    private String prompt;

    private Long sessionId;
    private String model;
    private Boolean stream;
    private Boolean webSearch;
}
