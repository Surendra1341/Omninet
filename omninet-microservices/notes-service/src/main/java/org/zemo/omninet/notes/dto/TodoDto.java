package org.zemo.omninet.notes.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.notes.entity.Todo;
import org.zemo.omninet.notes.enums.TodoPriority;
import org.zemo.omninet.notes.enums.TodoStatus;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TodoDto {
    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;

    @Builder.Default
    private TodoStatus status = TodoStatus.NOT_STARTED;

    @Builder.Default
    private TodoPriority priority = TodoPriority.MEDIUM;

    private LocalDateTime dueDate;
    private LocalDateTime reminderAt;
    private Boolean reminderSent;
    private String createdBy;
    private LocalDateTime createdOn;

    public static TodoDto fromEntity(Todo entity) {
        if (entity == null) return null;
        return TodoDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .dueDate(entity.getDueDate())
                .reminderAt(entity.getReminderAt())
                .reminderSent(entity.getReminderSent())
                .createdBy(entity.getCreatedBy())
                .createdOn(entity.getCreatedOn())
                .build();
    }
}
