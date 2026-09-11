package org.zemo.omninet.ai.controller;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.zemo.omninet.ai.dto.ChatMessageDto;
import org.zemo.omninet.ai.dto.ChatSessionDto;
import org.zemo.omninet.ai.entity.ChatSession;
import org.zemo.omninet.ai.service.ChatSessionService;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/v1/ai/sessions", "/api/ai/sessions", "/api/chat/sessions"})
@RequiredArgsConstructor
@Slf4j
public class ChatSessionController {

    private final ChatSessionService chatSessionService;

    @PostMapping({"", "/"})
    public ResponseEntity<ApiResponse<ChatSessionDto>> createSession(
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String title = body != null && body.get("title") != null ? body.get("title") : "New Conversation";

        ChatSession session = chatSessionService.createSession(userId, title);
        return ResponseEntity.ok(ApiResponse.success(ChatSessionDto.fromEntity(session), "Chat session created"));
    }

    @GetMapping({"", "/"})
    public ResponseEntity<ApiResponse<List<ChatSessionDto>>> getUserSessions(HttpServletRequest request) {
        String userId = GatewayHeaders.getUserId(request);
        List<ChatSessionDto> sessions = chatSessionService.getUserSessions(userId);
        return ResponseEntity.ok(ApiResponse.success(sessions, "User sessions retrieved"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ChatSessionDto>> getSessionById(
            @PathVariable Long id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        List<ChatSessionDto> sessions = chatSessionService.getUserSessions(userId);
        ChatSessionDto found = sessions.stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (found == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(ApiResponse.success(found, "Session retrieved"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ChatSessionDto>> updateSession(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        List<ChatSessionDto> sessions = chatSessionService.getUserSessions(userId);
        ChatSessionDto found = sessions.stream()
                .filter(s -> s.getId().equals(id))
                .findFirst()
                .orElse(null);

        if (found == null) {
            return ResponseEntity.notFound().build();
        }
        if (body != null && body.get("title") != null) {
            found.setTitle(body.get("title"));
        }
        return ResponseEntity.ok(ApiResponse.success(found, "Session updated"));
    }

    @GetMapping("/{id}/messages")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getSessionMessages(
            @PathVariable Long id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        List<ChatMessageDto> messages = chatSessionService.getSessionMessages(id, userId);
        return ResponseEntity.ok(ApiResponse.success(messages, "Session messages retrieved"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(
            @PathVariable Long id,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        chatSessionService.deleteSession(id, userId);
        return ResponseEntity.ok(ApiResponse.success(null, "Session deleted successfully"));
    }
}
