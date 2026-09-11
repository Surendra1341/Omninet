package org.zemo.omninet.notes.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.zemo.omninet.notes.entity.Todo;
import org.zemo.omninet.notes.enums.TodoPriority;
import org.zemo.omninet.notes.enums.TodoStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class TodoDto {
    private Integer id;

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @Builder.Default
    private TodoStatus status = TodoStatus.NOT_STARTED;

    @Builder.Default
    private TodoPriority priority = TodoPriority.MEDIUM;

    private LocalDateTime dueDate;
    private LocalDateTime reminderAt;
    private Boolean reminderSent;

    @Builder.Default
    private Boolean isRecurring = false;

    @Builder.Default
    private String recurrencePattern = "NONE";

    private LocalDateTime completedAt;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private List<TodoSubtaskDto> subtasks = new ArrayList<>();

    private String createdBy;
    private LocalDateTime createdOn;

    @JsonProperty("status")
    public void setStatusFlexible(Object statusObj) {
        if (statusObj == null) {
            this.status = TodoStatus.NOT_STARTED;
            return;
        }
        if (statusObj instanceof TodoStatus ts) {
            this.status = ts;
            return;
        }
        if (statusObj instanceof Map<?, ?> map) {
            Object idVal = map.get("id");
            if (idVal instanceof Number n) {
                switch (n.intValue()) {
                    case 1 -> this.status = TodoStatus.NOT_STARTED;
                    case 2 -> this.status = TodoStatus.IN_PROGRESS;
                    case 3 -> this.status = TodoStatus.COMPLETED;
                    default -> this.status = TodoStatus.NOT_STARTED;
                }
                return;
            }
            Object nameVal = map.get("name");
            if (nameVal instanceof String s) {
                parseStatusString(s);
                return;
            }
        }
        if (statusObj instanceof String str) {
            parseStatusString(str);
        }
    }

    private void parseStatusString(String str) {
        String upper = str.trim().toUpperCase().replace(" ", "_");
        if (upper.contains("COMPLET")) {
            this.status = TodoStatus.COMPLETED;
        } else if (upper.contains("PROG")) {
            this.status = TodoStatus.IN_PROGRESS;
        } else {
            try {
                this.status = TodoStatus.valueOf(upper);
            } catch (Exception ignored) {
                this.status = TodoStatus.NOT_STARTED;
            }
        }
    }

    @JsonProperty("priority")
    public void setPriorityFlexible(Object priorityObj) {
        if (priorityObj == null) {
            this.priority = TodoPriority.MEDIUM;
            return;
        }
        if (priorityObj instanceof TodoPriority tp) {
            this.priority = tp;
            return;
        }
        if (priorityObj instanceof String str) {
            try {
                this.priority = TodoPriority.valueOf(str.trim().toUpperCase());
            } catch (Exception ignored) {
                this.priority = TodoPriority.MEDIUM;
            }
        }
    }

    public static TodoDto fromEntity(Todo entity) {
        if (entity == null) return null;
        return TodoDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .description(entity.getDescription())
                .status(entity.getStatus())
                .priority(entity.getPriority())
                .dueDate(entity.getDueDate())
                .reminderAt(entity.getReminderAt())
                .reminderSent(entity.getReminderSent())
                .isRecurring(entity.getIsRecurring())
                .recurrencePattern(entity.getRecurrencePattern())
                .completedAt(entity.getCompletedAt())
                .tags(entity.getTags() != null ? new ArrayList<>(entity.getTags()) : new ArrayList<>())
                .subtasks(entity.getSubtasks() != null
                        ? entity.getSubtasks().stream().map(TodoSubtaskDto::fromEntity).collect(Collectors.toList())
                        : new ArrayList<>())
                .createdBy(entity.getCreatedBy())
                .createdOn(entity.getCreatedOn())
                .build();
    }
}
