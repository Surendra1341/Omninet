package org.zemo.omninet.notes.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.notes.entity.Todo;
import org.zemo.omninet.notes.enums.TodoStatus;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface TodoRepository extends JpaRepository<Todo, Integer> {
    Page<Todo> findByCreatedBy(String createdBy, Pageable pageable);
    List<Todo> findByCreatedBy(String createdBy);
    List<Todo> findByCreatedByAndStatus(String createdBy, TodoStatus status);
    Optional<Todo> findByIdAndCreatedBy(Integer id, String createdBy);
    List<Todo> findByReminderAtBeforeAndReminderSentFalse(LocalDateTime dateTime);
    List<Todo> findByCreatedByAndDueDateBetween(String createdBy, LocalDateTime start, LocalDateTime end);
    long countByCreatedByAndStatus(String createdBy, TodoStatus status);
    long countByCreatedBy(String createdBy);
}
