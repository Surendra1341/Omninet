package org.zemo.omninet.notes.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.zemo.omninet.common.event.NoteEvent;
import org.zemo.omninet.common.exception.BusinessException;
import org.zemo.omninet.common.exception.ResourceNotFoundException;
import org.zemo.omninet.notes.dto.NotesDto;
import org.zemo.omninet.notes.dto.NotesRequest;
import org.zemo.omninet.notes.dto.NotesResponse;
import org.zemo.omninet.notes.entity.Category;
import org.zemo.omninet.notes.entity.FileDetails;
import org.zemo.omninet.notes.entity.Notes;
import org.zemo.omninet.notes.event.NotesEventProducer;
import org.zemo.omninet.notes.grpc.StorageGrpcClient;
import org.zemo.omninet.notes.repository.NotesRepository;
import org.zemo.omninet.proto.storage.UploadFileResponse;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotesService {

    private final NotesRepository notesRepository;
    private final CategoryService categoryService;
    private final StorageGrpcClient storageGrpcClient;
    private final NotesEventProducer notesEventProducer;

    @Transactional
    public NotesDto createNote(NotesRequest request, MultipartFile file, String userId, String userEmail) {
        Category category = categoryService.getCategoryEntity(request.getCategoryId(), userId);

        FileDetails fileDetails = null;
        if (file != null && !file.isEmpty()) {
            fileDetails = handleFileUpload(file, userEmail);
        }

        Notes note = Notes.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .category(category)
                .fileDetails(fileDetails)
                .isPinned(request.getIsPinned() != null ? request.getIsPinned() : false)
                .isFavorite(request.getIsFavorite() != null ? request.getIsFavorite() : false)
                .isDeleted(false)
                .build();
        note.setCreatedBy(userId);

        Notes saved = notesRepository.save(note);
        log.info("Created note id={} for user {}", saved.getId(), userId);

        notesEventProducer.publishNoteEvent(saved.getId(), userId, saved.getTitle(),
                category.getName(), NoteEvent.Action.CREATED, fileDetails != null);

        return NotesDto.fromEntity(saved);
    }

    @Transactional
    public NotesDto updateNote(Integer id, NotesRequest request, MultipartFile file, String userId, String userEmail) {
        Notes note = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        if (note.getIsDeleted()) {
            throw new BusinessException("Cannot edit a note in the recycle bin. Restore it first.");
        }

        if (request.getCategoryId() != null) {
            Category category = categoryService.getCategoryEntity(request.getCategoryId(), userId);
            note.setCategory(category);
        }

        if (request.getTitle() != null) {
            note.setTitle(request.getTitle());
        }
        if (request.getDescription() != null) {
            note.setDescription(request.getDescription());
        }
        if (request.getIsPinned() != null) {
            note.setIsPinned(request.getIsPinned());
        }
        if (request.getIsFavorite() != null) {
            note.setIsFavorite(request.getIsFavorite());
        }

        if (file != null && !file.isEmpty()) {
            // Delete old file if existed
            if (note.getFileDetails() != null) {
                try {
                    storageGrpcClient.deleteAttachment(userEmail, note.getFileDetails().getUploadFileName());
                } catch (Exception e) {
                    log.warn("Could not delete old attachment: {}", e.getMessage());
                }
            }
            note.setFileDetails(handleFileUpload(file, userEmail));
        }

        note.setUpdatedBy(userId);
        Notes updated = notesRepository.save(note);

        notesEventProducer.publishNoteEvent(updated.getId(), userId, updated.getTitle(),
                updated.getCategory() != null ? updated.getCategory().getName() : "",
                NoteEvent.Action.UPDATED, updated.getFileDetails() != null);

        return NotesDto.fromEntity(updated);
    }

    public NotesResponse getAllNotes(String userId, Pageable pageable) {
        Page<Notes> page = notesRepository.findByCreatedByAndIsDeletedFalse(userId, pageable);
        return toNotesResponse(page);
    }

    public NotesResponse getNotesByCategory(String userId, Integer categoryId, Pageable pageable) {
        Page<Notes> page = notesRepository.findByCreatedByAndCategoryIdAndIsDeletedFalse(userId, categoryId, pageable);
        return toNotesResponse(page);
    }

    public NotesDto getNoteById(Integer id, String userId) {
        Notes note = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));
        return NotesDto.fromEntity(note);
    }

    public NotesResponse searchNotes(String userId, String query, Pageable pageable) {
        Page<Notes> page = notesRepository.searchNotes(userId, query, pageable);
        return toNotesResponse(page);
    }

    @Transactional
    public void softDeleteNote(Integer id, String userId) {
        Notes note = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        note.setIsDeleted(true);
        note.setDeletedOn(LocalDateTime.now());
        note.setUpdatedBy(userId);
        notesRepository.save(note);

        notesEventProducer.publishNoteEvent(note.getId(), userId, note.getTitle(),
                note.getCategory() != null ? note.getCategory().getName() : "",
                NoteEvent.Action.SOFT_DELETED, note.getFileDetails() != null);
    }

    @Transactional
    public NotesDto restoreNote(Integer id, String userId) {
        Notes note = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found in recycle bin with id: " + id));

        note.setIsDeleted(false);
        note.setDeletedOn(null);
        note.setUpdatedBy(userId);
        Notes restored = notesRepository.save(note);

        notesEventProducer.publishNoteEvent(restored.getId(), userId, restored.getTitle(),
                restored.getCategory() != null ? restored.getCategory().getName() : "",
                NoteEvent.Action.RESTORED, restored.getFileDetails() != null);

        return NotesDto.fromEntity(restored);
    }

    @Transactional
    public void hardDeleteNote(Integer id, String userId, String userEmail) {
        Notes note = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        if (note.getFileDetails() != null) {
            try {
                storageGrpcClient.deleteAttachment(userEmail, note.getFileDetails().getUploadFileName());
            } catch (Exception e) {
                log.warn("Failed to delete attachment from storage: {}", e.getMessage());
            }
        }

        notesRepository.delete(note);
        notesEventProducer.publishNoteEvent(id, userId, note.getTitle(),
                note.getCategory() != null ? note.getCategory().getName() : "",
                NoteEvent.Action.HARD_DELETED, false);
    }

    public NotesResponse getRecycleBinNotes(String userId, Pageable pageable) {
        Page<Notes> page = notesRepository.findByCreatedByAndIsDeletedTrue(userId, pageable);
        return toNotesResponse(page);
    }

    @Transactional
    public void emptyRecycleBin(String userId, String userEmail) {
        notesRepository.emptyRecycleBin(userId);
        log.info("Emptied recycle bin for user {}", userId);
    }

    @Transactional
    public NotesDto copyNote(Integer id, String userId) {
        Notes original = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        Notes copy = Notes.builder()
                .title(original.getTitle() + " (Copy)")
                .description(original.getDescription())
                .category(original.getCategory())
                .isPinned(false)
                .isFavorite(false)
                .isDeleted(false)
                .build();
        copy.setCreatedBy(userId);

        Notes saved = notesRepository.save(copy);
        notesEventProducer.publishNoteEvent(saved.getId(), userId, saved.getTitle(),
                saved.getCategory() != null ? saved.getCategory().getName() : "",
                NoteEvent.Action.COPIED, false);

        return NotesDto.fromEntity(saved);
    }

    @Transactional
    public NotesDto togglePin(Integer id, String userId) {
        Notes note = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        note.setIsPinned(!note.getIsPinned());
        note.setUpdatedBy(userId);
        Notes saved = notesRepository.save(note);
        return NotesDto.fromEntity(saved);
    }

    @Transactional
    public NotesDto toggleFavorite(Integer id, String userId) {
        Notes note = notesRepository.findByIdAndCreatedBy(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Note not found with id: " + id));

        note.setIsFavorite(!note.getIsFavorite());
        note.setUpdatedBy(userId);
        Notes saved = notesRepository.save(note);
        return NotesDto.fromEntity(saved);
    }

    private FileDetails handleFileUpload(MultipartFile file, String userEmail) {
        try {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment";
            String uniqueFilename = UUID.randomUUID() + "_" + originalFilename;

            UploadFileResponse response = storageGrpcClient.uploadAttachment(
                    userEmail,
                    uniqueFilename,
                    file.getBytes(),
                    file.getContentType()
            );

            return FileDetails.builder()
                    .uploadFileName(uniqueFilename)
                    .originalFileName(originalFilename)
                    .displayFileName(originalFilename)
                    .path(response.getFilePath())
                    .fileSize(file.getSize())
                    .build();
        } catch (IOException e) {
            log.error("Failed to read upload file bytes: {}", e.getMessage());
            throw new BusinessException("Attachment upload failed: " + e.getMessage());
        }
    }

    private NotesResponse toNotesResponse(Page<Notes> page) {
        return NotesResponse.builder()
                .notes(page.getContent().stream().map(NotesDto::fromEntity).collect(Collectors.toList()))
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .build();
    }
}
