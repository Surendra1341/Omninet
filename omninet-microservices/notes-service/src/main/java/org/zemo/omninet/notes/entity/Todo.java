package org.zemo.omninet.notes.entity;

import jakarta.persistence.*;
import lombok.*;
import org.zemo.omninet.notes.enums.TodoPriority;
import org.zemo.omninet.notes.enums.TodoStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@EqualsAndHashCode(callSuper = true, exclude = {"subtasks", "tags"})
@ToString(exclude = {"subtasks", "tags"})
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "todos", indexes = {
        @Index(name = "idx_todos_created_by", columnList = "created_by"),
        @Index(name = "idx_todos_status", columnList = "status"),
        @Index(name = "idx_todos_due_date", columnList = "due_date")
})
public class Todo extends BaseModel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TodoStatus status = TodoStatus.NOT_STARTED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TodoPriority priority = TodoPriority.MEDIUM;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "reminder_at")
    private LocalDateTime reminderAt;

    @Column(name = "reminder_sent")
    @Builder.Default
    private Boolean reminderSent = false;

    @Column(name = "is_recurring")
    @Builder.Default
    private Boolean isRecurring = false;

    @Column(name = "recurrence_pattern")
    @Builder.Default
    private String recurrencePattern = "NONE";

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "todo_tags", joinColumns = @JoinColumn(name = "todo_id"))
    @Column(name = "tag")
    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @OneToMany(mappedBy = "todo", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("sortOrder ASC, id ASC")
    @Builder.Default
    private List<TodoSubtask> subtasks = new ArrayList<>();
}
