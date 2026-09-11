package org.zemo.omninet.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.ai.entity.ChatSession;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatSessionDto {
    private Long id;
    private String title;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private int messageCount;

    public static ChatSessionDto fromEntity(ChatSession entity) {
        if (entity == null) return null;
        return ChatSessionDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .messageCount(entity.getMessages() != null ? entity.getMessages().size() : 0)
                .build();
    }
}
