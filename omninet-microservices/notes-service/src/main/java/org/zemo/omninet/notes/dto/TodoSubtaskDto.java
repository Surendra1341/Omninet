package org.zemo.omninet.notes.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.notes.entity.TodoSubtask;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoSubtaskDto {
    private Integer id;
    private String title;
    @Builder.Default
    private Boolean isCompleted = false;
    @Builder.Default
    private Integer sortOrder = 0;

    public static TodoSubtaskDto fromEntity(TodoSubtask entity) {
        if (entity == null) return null;
        return TodoSubtaskDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .isCompleted(entity.getIsCompleted())
                .sortOrder(entity.getSortOrder())
                .build();
    }
}
