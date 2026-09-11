package org.zemo.omninet.notes.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.common.exception.ResourceNotFoundException;
import org.zemo.omninet.notes.dto.TodoAnalyticsDto;
import org.zemo.omninet.notes.dto.TodoDto;
import org.zemo.omninet.notes.dto.TodoSubtaskDto;
import org.zemo.omninet.notes.entity.Todo;
import org.zemo.omninet.notes.entity.TodoSubtask;
import org.zemo.omninet.notes.enums.TodoPriority;
import org.zemo.omninet.notes.enums.TodoStatus;
import org.zemo.omninet.notes.event.NotesEventProducer;
import org.zemo.omninet.notes.repository.TodoRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class TodoService {

    private final TodoRepository todoRepository;
    private final NotesEventProducer notesEventProducer;

    @Transactional
    public TodoDto createTodo(TodoDto request, String userId) {
        Todo todo = Todo.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .status(request.getStatus() != null ? request.getStatus() : TodoStatus.NOT_STARTED)
                .priority(request.getPriority() != null ? request.getPriority() : TodoPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .reminderAt(request.getReminderAt())
                .reminderSent(false)
                .isRecurring(request.getIsRecurring() != null ? request.getIsRecurring() : false)
                .recurrencePattern(request.getRecurrencePattern() != null ? request.getRecurrencePattern() : "NONE")
                .tags(request.getTags() != null ? new ArrayList<>(request.getTags()) : new ArrayList<>())
                .build();
        todo.setCreatedBy(userId);

        if (todo.getStatus() == TodoStatus.COMPLETED) {
            todo.setCompletedAt(LocalDateTime.now());
        }

        // Attach subtasks if provided
        if (request.getSubtasks() != null && !request.getSubtasks().isEmpty()) {
            List<TodoSubtask> subtasks = new ArrayList<>();
            for (int i = 0; i < request.getSubtasks().size(); i++) {
                TodoSubtaskDto subDto = request.getSubtasks().get(i);
                if (subDto.getTitle() != null && !subDto.getTitle().isBlank()) {
                    subtasks.add(TodoSubtask.builder()
                            .todo(todo)
                            .title(subDto.getTitle().trim())
                            .isCompleted(Boolean.TRUE.equals(subDto.getIsCompleted()))
                            .sortOrder(subDto.getSortOrder() != null ? subDto.getSortOrder() : i)
                            .build());
                }
            }
            todo.setSubtasks(subtasks);
        }

        Todo saved = todoRepository.save(todo);
        log.info("Created todo id={} for user {}", saved.getId(), userId);
        return TodoDto.fromEntity(saved);
    }

    @Transactional
    public TodoDto updateTodo(Integer id, TodoDto request, String userId) {
        Todo todo = todoRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Todo not found with id: " + id));

        if (request.getTitle() != null) {
            todo.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            todo.setDescription(request.getDescription());
        }
        if (request.getPriority() != null) {
            todo.setPriority(request.getPriority());
        }
        if (request.getDueDate() != null) {
            todo.setDueDate(request.getDueDate());
        }
        if (request.getReminderAt() != null) {
            todo.setReminderAt(request.getReminderAt());
            todo.setReminderSent(false);
        }
        if (request.getIsRecurring() != null) {
            todo.setIsRecurring(request.getIsRecurring());
        }
        if (request.getRecurrencePattern() != null) {
            todo.setRecurrencePattern(request.getRecurrencePattern());
        }
        if (request.getTags() != null) {
            todo.getTags().clear();
            todo.getTags().addAll(request.getTags());
        }

        // Handle subtasks update
        if (request.getSubtasks() != null) {
            todo.getSubtasks().clear();
            for (int i = 0; i < request.getSubtasks().size(); i++) {
                TodoSubtaskDto subDto = request.getSubtasks().get(i);
                if (subDto.getTitle() != null && !subDto.getTitle().isBlank()) {
                    todo.getSubtasks().add(TodoSubtask.builder()
                            .todo(todo)
                            .title(subDto.getTitle().trim())
                            .isCompleted(Boolean.TRUE.equals(subDto.getIsCompleted()))
                            .sortOrder(subDto.getSortOrder() != null ? subDto.getSortOrder() : i)
                            .build());
                }
            }
        }

        // Status update
        if (request.getStatus() != null) {
            applyStatusChange(todo, request.getStatus());
        }

        todo.setUpdatedBy(userId);
        Todo saved = todoRepository.save(todo);
        return TodoDto.fromEntity(saved);
    }

    @Transactional
    public TodoDto updateStatus(Integer id, TodoStatus status, String userId) {
        Todo todo = todoRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Todo not found with id: " + id));

        applyStatusChange(todo, status);
        todo.setUpdatedBy(userId);
        Todo saved = todoRepository.save(todo);
        return TodoDto.fromEntity(saved);
    }

    private void applyStatusChange(Todo todo, TodoStatus newStatus) {
        if (newStatus == TodoStatus.COMPLETED) {
            todo.setCompletedAt(LocalDateTime.now());

            // Check if recurring
            if (Boolean.TRUE.equals(todo.getIsRecurring()) && !"NONE".equalsIgnoreCase(todo.getRecurrencePattern())) {
                LocalDateTime currentDue = todo.getDueDate() != null ? todo.getDueDate() : LocalDateTime.now();
                LocalDateTime nextDue = switch (todo.getRecurrencePattern().toUpperCase()) {
                    case "DAILY" -> currentDue.plusDays(1);
                    case "WEEKLY" -> currentDue.plusWeeks(1);
                    case "MONTHLY" -> currentDue.plusMonths(1);
                    default -> currentDue.plusDays(1);
                };
                todo.setDueDate(nextDue);
                todo.setStatus(TodoStatus.NOT_STARTED);
                // Reset subtasks for next iteration
                if (todo.getSubtasks() != null) {
                    todo.getSubtasks().forEach(s -> s.setIsCompleted(false));
                }
                log.info("Advanced recurring task id={} to next due date: {}", todo.getId(), nextDue);
            } else {
                todo.setStatus(TodoStatus.COMPLETED);
                // Mark all subtasks completed
                if (todo.getSubtasks() != null) {
                    todo.getSubtasks().forEach(s -> s.setIsCompleted(true));
                }
            }
        } else {
            todo.setStatus(newStatus);
            todo.setCompletedAt(null);
        }
    }

    @Transactional
    public TodoDto toggleSubtask(Integer todoId, Integer subtaskId, String userId) {
        Todo todo = todoRepository.findByIdAndCreatedBy(todoId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Todo not found with id: " + todoId));

        if (todo.getSubtasks() != null) {
            for (TodoSubtask subtask : todo.getSubtasks()) {
                if (subtask.getId() != null && subtask.getId().equals(subtaskId)) {
                    subtask.setIsCompleted(!Boolean.TRUE.equals(subtask.getIsCompleted()));
                    break;
                }
            }
        }

        todo.setUpdatedBy(userId);
        Todo saved = todoRepository.save(todo);
        return TodoDto.fromEntity(saved);
    }

    public Page<TodoDto> getTodos(String userId, Pageable pageable) {
        return todoRepository.findByCreatedBy(userId, pageable)
                .map(TodoDto::fromEntity);
    }

    public List<TodoDto> getAllTodos(String userId) {
        return todoRepository.findByCreatedBy(userId)
                .stream()
                .map(TodoDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<TodoDto> getTodosByStatus(String userId, TodoStatus status) {
        return todoRepository.findByCreatedByAndStatus(userId, status)
                .stream()
                .map(TodoDto::fromEntity)
                .collect(Collectors.toList());
    }

    public TodoDto getTodoById(Integer id, String userId) {
        Todo todo = todoRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Todo not found with id: " + id));
        return TodoDto.fromEntity(todo);
    }

    @Transactional
    public void deleteTodo(Integer id, String userId) {
        Todo todo = todoRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Todo not found with id: " + id));
        todoRepository.delete(todo);
        log.info("Deleted todo id={} for user {}", id, userId);
    }

    public TodoAnalyticsDto getAnalytics(String userId) {
        List<Todo> todos = todoRepository.findByCreatedBy(userId);

        long total = todos.size();
        long completed = todos.stream().filter(t -> t.getStatus() == TodoStatus.COMPLETED).count();
        long inProgress = todos.stream().filter(t -> t.getStatus() == TodoStatus.IN_PROGRESS).count();
        long notStarted = todos.stream().filter(t -> t.getStatus() == TodoStatus.NOT_STARTED).count();

        double rate = total > 0 ? Math.round(((double) completed / total) * 1000.0) / 10.0 : 0.0;

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();
        LocalDateTime endOfToday = LocalDate.now().atTime(LocalTime.MAX);
        LocalDateTime startOfWeek = LocalDate.now().minusDays(LocalDate.now().getDayOfWeek().getValue() - 1).atStartOfDay();

        long completedToday = todos.stream()
                .filter(t -> t.getCompletedAt() != null &&
                        !t.getCompletedAt().isBefore(startOfToday) &&
                        !t.getCompletedAt().isAfter(endOfToday))
                .count();

        long completedThisWeek = todos.stream()
                .filter(t -> t.getCompletedAt() != null && !t.getCompletedAt().isBefore(startOfWeek))
                .count();

        long overdue = todos.stream()
                .filter(t -> t.getStatus() != TodoStatus.COMPLETED &&
                        t.getDueDate() != null &&
                        t.getDueDate().isBefore(now))
                .count();

        // Priority distribution
        Map<String, Long> priorityDist = new HashMap<>();
        for (TodoPriority p : TodoPriority.values()) {
            priorityDist.put(p.name(), todos.stream().filter(t -> t.getPriority() == p).count());
        }

        // Tag distribution
        Map<String, Long> tagDist = new HashMap<>();
        for (Todo t : todos) {
            if (t.getTags() != null) {
                for (String tag : t.getTags()) {
                    if (tag != null && !tag.isBlank()) {
                        tagDist.merge(tag.trim().toLowerCase(), 1L, Long::sum);
                    }
                }
            }
        }

        // Calculate consecutive streak days
        Set<LocalDate> completedDates = todos.stream()
                .filter(t -> t.getCompletedAt() != null)
                .map(t -> t.getCompletedAt().toLocalDate())
                .collect(Collectors.toSet());

        int streak = 0;
        LocalDate checkDate = LocalDate.now();
        if (!completedDates.contains(checkDate)) {
            checkDate = checkDate.minusDays(1);
        }

        while (completedDates.contains(checkDate)) {
            streak++;
            checkDate = checkDate.minusDays(1);
        }

        return TodoAnalyticsDto.builder()
                .totalTasks(total)
                .completedTasks(completed)
                .inProgressTasks(inProgress)
                .notStartedTasks(notStarted)
                .completionRate(rate)
                .completedToday(completedToday)
                .completedThisWeek(completedThisWeek)
                .overdueCount(overdue)
                .streakDays(streak)
                .priorityDistribution(priorityDist)
                .tagDistribution(tagDist)
                .build();
    }
}
