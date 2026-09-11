package org.zemo.omninet.notes.scheduler;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.notes.entity.Notes;
import org.zemo.omninet.notes.entity.Todo;
import org.zemo.omninet.notes.event.NotesEventProducer;
import org.zemo.omninet.notes.repository.NotesRepository;
import org.zemo.omninet.notes.repository.TodoRepository;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class NotesScheduler {

    private final NotesRepository notesRepository;
    private final TodoRepository todoRepository;
    private final NotesEventProducer notesEventProducer;

    // Run daily at midnight to purge notes deleted > 30 days ago
    @Scheduled(cron = "0 0 0 * * ?")
    @Transactional
    public void cleanupOldRecycleBinNotes() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        log.info("Running scheduled cleanup for notes deleted before {}", cutoff);

        List<Notes> staleNotes = notesRepository.findByIsDeletedTrueAndDeletedOnBefore(cutoff);
        if (!staleNotes.isEmpty()) {
            notesRepository.deleteAll(staleNotes);
            log.info("Purged {} expired notes from recycle bin", staleNotes.size());
        }
    }

    // Run every minute to check for pending todo reminders
    @Scheduled(fixedDelay = 60000)
    @Transactional
    public void checkTodoReminders() {
        LocalDateTime now = LocalDateTime.now();
        List<Todo> dueReminders = todoRepository.findByReminderAtBeforeAndReminderSentFalse(now);

        for (Todo todo : dueReminders) {
            log.info("Triggering reminder for todo id={}, user={}", todo.getId(), todo.getCreatedBy());
            notesEventProducer.publishTodoReminder(
                    todo.getId(),
                    todo.getCreatedBy(),
                    todo.getTitle(),
                    todo.getDueDate() != null ? todo.getDueDate().toString() : null
            );
            todo.setReminderSent(true);
            todoRepository.save(todo);
        }
    }
}
