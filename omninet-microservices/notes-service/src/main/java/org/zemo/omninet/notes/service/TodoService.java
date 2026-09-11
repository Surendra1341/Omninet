package org.zemo.omninet.notes.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.common.exception.ResourceNotFoundException;
import org.zemo.omninet.notes.dto.TodoDto;
import org.zemo.omninet.notes.entity.Todo;
import org.zemo.omninet.notes.enums.TodoPriority;
import org.zemo.omninet.notes.enums.TodoStatus;
import org.zemo.omninet.notes.event.NotesEventProducer;
import org.zemo.omninet.notes.repository.TodoRepository;

import java.util.List;
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
                .status(request.getStatus() != null ? request.getStatus() : TodoStatus.NOT_STARTED)
                .priority(request.getPriority() != null ? request.getPriority() : TodoPriority.MEDIUM)
                .dueDate(request.getDueDate())
                .reminderAt(request.getReminderAt())
                .reminderSent(false)
                .build();
        todo.setCreatedBy(userId);

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
        if (request.getStatus() != null) {
            todo.setStatus(request.getStatus());
        }
        if (request.getPriority() != null) {
            todo.setPriority(request.getPriority());
        }
        if (request.getDueDate() != null) {
            todo.setDueDate(request.getDueDate());
        }
        if (request.getReminderAt() != null) {
            todo.setReminderAt(request.getReminderAt());
            todo.setReminderSent(false); // Reset reminder if time changed
        }
        todo.setUpdatedBy(userId);

        Todo saved = todoRepository.save(todo);
        return TodoDto.fromEntity(saved);
    }

    @Transactional
    public TodoDto updateStatus(Integer id, TodoStatus status, String userId) {
        Todo todo = todoRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Todo not found with id: " + id));

        todo.setStatus(status);
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
}
