package org.zemo.omninet.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.ai.entity.ChatMessage;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessageDto {
    private Long id;
    private ChatMessage.MessageType type;
    private String content;
    private String audioFilePath;
    private LocalDateTime createdAt;

    public static ChatMessageDto fromEntity(ChatMessage entity) {
        if (entity == null) return null;
        return ChatMessageDto.builder()
                .id(entity.getId())
                .type(entity.getType())
                .content(entity.getContent())
                .audioFilePath(entity.getAudioFilePath())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
