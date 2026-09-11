package org.zemo.omninet.notes.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;
import org.zemo.omninet.notes.dto.NotesDto;
import org.zemo.omninet.notes.dto.NotesRequest;
import org.zemo.omninet.notes.dto.NotesResponse;
import org.zemo.omninet.notes.grpc.StorageGrpcClient;
import org.zemo.omninet.notes.service.NotesService;

@RestController
@RequestMapping({"/api/v1/notes", "/api/notes"})
@RequiredArgsConstructor
@Slf4j
public class NotesController {

    private final NotesService notesService;
    private final StorageGrpcClient storageGrpcClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping(value = {"", "/"}, consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<NotesDto>> createNote(
            @RequestPart(value = "note", required = false) String noteJson,
            @RequestPart(value = "notes", required = false) String notesJson,
            @RequestParam(value = "note", required = false) String noteParam,
            @RequestParam(value = "notes", required = false) String notesParam,
            @RequestBody(required = false) NotesRequest jsonRequest,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest request) throws Exception {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        String rawJson = noteJson != null ? noteJson : (notesJson != null ? notesJson : (noteParam != null ? noteParam : notesParam));
        NotesRequest notesRequest = jsonRequest != null ? jsonRequest : objectMapper.readValue(rawJson, NotesRequest.class);
        NotesDto note = notesService.createNote(notesRequest, file, userId, userEmail);

        return ResponseEntity.ok(ApiResponse.success(note, "Note created successfully"));
    }

    @PutMapping(value = {"/{id}", ""}, consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_JSON_VALUE})
    public ResponseEntity<ApiResponse<NotesDto>> updateNote(
            @PathVariable(required = false) Integer id,
            @RequestPart(value = "note", required = false) String noteJson,
            @RequestPart(value = "notes", required = false) String notesJson,
            @RequestParam(value = "note", required = false) String noteParam,
            @RequestParam(value = "notes", required = false) String notesParam,
            @RequestBody(required = false) NotesRequest jsonRequest,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest request) throws Exception {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        String rawJson = noteJson != null ? noteJson : (notesJson != null ? notesJson : (noteParam != null ? noteParam : notesParam));
        NotesRequest notesRequest = jsonRequest != null ? jsonRequest : objectMapper.readValue(rawJson, NotesRequest.class);
        Integer noteId = id != null ? id : (notesRequest.getId() != null ? notesRequest.getId() : null);

        NotesDto note = notesService.updateNote(noteId, notesRequest, file, userId, userEmail);

        return ResponseEntity.ok(ApiResponse.success(note, "Note updated successfully"));
    }

    @GetMapping({"", "/", "/user-notes"})
    public ResponseEntity<ApiResponse<NotesResponse>> getAllNotes(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "pageNo", defaultValue = "0") int pageNo,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
            @RequestParam(defaultValue = "updatedOn") String sortBy,
            @RequestParam(defaultValue = "desc") String direction,
            HttpServletRequest request) {

        int finalPage = pageNo != 0 ? pageNo : page;
        int finalSize = pageSize != 10 ? pageSize : size;

        String userId = GatewayHeaders.getUserId(request);
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(finalPage, finalSize, sort);

        NotesResponse notes = notesService.getAllNotes(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(notes, "Notes retrieved successfully"));
    }

    @GetMapping("/category/{categoryId}")
    public ResponseEntity<ApiResponse<NotesResponse>> getNotesByCategory(
            @PathVariable Integer categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        Pageable pageable = PageRequest.of(page, size, Sort.by("updatedOn").descending());

        NotesResponse notes = notesService.getNotesByCategory(userId, categoryId, pageable);
        return ResponseEntity.ok(ApiResponse.success(notes, "Category notes retrieved successfully"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<NotesDto>> getNoteById(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        NotesDto note = notesService.getNoteById(id, userId);
        return ResponseEntity.ok(ApiResponse.success(note, "Note retrieved"));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<NotesResponse>> searchNotes(
            @RequestParam(required = false) String query,
            @RequestParam(required = false) String keyword,
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "pageNo", defaultValue = "0") int pageNo,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
            HttpServletRequest request) {

        String searchTerm = query != null ? query : (keyword != null ? keyword : "");
        int finalPage = pageNo != 0 ? pageNo : page;
        int finalSize = pageSize != 10 ? pageSize : size;

        String userId = GatewayHeaders.getUserId(request);
        Pageable pageable = PageRequest.of(finalPage, finalSize, Sort.by("updatedOn").descending());

        NotesResponse notes = notesService.searchNotes(userId, searchTerm, pageable);
        return ResponseEntity.ok(ApiResponse.success(notes, "Search results"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> softDeleteNote(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        notesService.softDeleteNote(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Note moved to recycle bin"));
    }

    @GetMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> softDeleteNoteViaGet(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        notesService.softDeleteNote(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Note moved to recycle bin"));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<NotesDto>> restoreNote(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        NotesDto note = notesService.restoreNote(id, userId);
        return ResponseEntity.ok(ApiResponse.success(note, "Note restored successfully"));
    }

    @DeleteMapping({"/delete/{id}", "/{id}/permanent"})
    public ResponseEntity<ApiResponse<Void>> hardDeleteNote(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        notesService.hardDeleteNote(id, userId, userEmail);
        return ResponseEntity.ok(ApiResponse.success(null, "Note permanently deleted"));
    }

    @GetMapping("/recycle-bin")
    public ResponseEntity<ApiResponse<NotesResponse>> getRecycleBin(
            @RequestParam(name = "page", defaultValue = "0") int page,
            @RequestParam(name = "pageNo", defaultValue = "0") int pageNo,
            @RequestParam(name = "size", defaultValue = "10") int size,
            @RequestParam(name = "pageSize", defaultValue = "10") int pageSize,
            HttpServletRequest request) {

        int finalPage = pageNo != 0 ? pageNo : page;
        int finalSize = pageSize != 10 ? pageSize : size;

        String userId = GatewayHeaders.getUserId(request);
        Pageable pageable = PageRequest.of(finalPage, finalSize, Sort.by("deletedOn").descending());

        NotesResponse notes = notesService.getRecycleBinNotes(userId, pageable);
        return ResponseEntity.ok(ApiResponse.success(notes, "Recycle bin items retrieved"));
    }

    @DeleteMapping({"/delete-recycle", "/recycle-bin/empty"})
    public ResponseEntity<ApiResponse<Void>> emptyRecycleBin(
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        notesService.emptyRecycleBin(userId, userEmail);
        return ResponseEntity.ok(ApiResponse.success(null, "Recycle bin emptied"));
    }

    @GetMapping("/copy/{id}")
    public ResponseEntity<ApiResponse<NotesDto>> copyNoteViaGet(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        NotesDto copy = notesService.copyNote(id, userId);
        return ResponseEntity.ok(ApiResponse.success(copy, "Note duplicated successfully"));
    }

    @PostMapping("/{id}/copy")
    public ResponseEntity<ApiResponse<NotesDto>> copyNote(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        NotesDto copy = notesService.copyNote(id, userId);
        return ResponseEntity.ok(ApiResponse.success(copy, "Note duplicated successfully"));
    }

    @PostMapping("/{id}/pin")
    public ResponseEntity<ApiResponse<NotesDto>> togglePin(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        NotesDto note = notesService.togglePin(id, userId);
        return ResponseEntity.ok(ApiResponse.success(note, "Note pinned/unpinned"));
    }

    @PostMapping("/{id}/favorite")
    public ResponseEntity<ApiResponse<NotesDto>> toggleFavorite(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        NotesDto note = notesService.toggleFavorite(id, userId);
        return ResponseEntity.ok(ApiResponse.success(note, "Note favorite toggled"));
    }

    @GetMapping({"/download/{id}", "/{id}/download-file"})
    public ResponseEntity<Resource> downloadAttachment(
            @PathVariable Integer id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        NotesDto note = notesService.getNoteById(id, userId);

        if (note.getFileDetails() == null) {
            return ResponseEntity.notFound().build();
        }

        byte[] bytes = storageGrpcClient.downloadAttachment(note.getFileDetails().getPath());
        ByteArrayResource resource = new ByteArrayResource(bytes);

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + note.getFileDetails().getOriginalFileName() + "\"")
                .body(resource);
    }
}
