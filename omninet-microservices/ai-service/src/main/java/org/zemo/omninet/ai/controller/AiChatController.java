package org.zemo.omninet.ai.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.zemo.omninet.ai.dto.ChatRequest;
import org.zemo.omninet.ai.dto.ChatResponse;
import org.zemo.omninet.ai.dto.VoiceChatResponse;
import org.zemo.omninet.ai.entity.AiUserMemory;
import org.zemo.omninet.ai.service.AiService;
import org.zemo.omninet.ai.service.UserMemoryService;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping({"/api/v1/ai/chat", "/api/ai/chat"})
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final AiService aiService;
    private final UserMemoryService userMemoryService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Standard JSON chat invocation.
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<ChatResponse>> sendChatMessageJson(
            @RequestBody ChatRequest jsonRequest,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String prompt = jsonRequest != null ? jsonRequest.getPrompt() : "";
        Long sessionId = jsonRequest != null ? jsonRequest.getSessionId() : null;
        boolean webSearch = jsonRequest == null || jsonRequest.getWebSearch() == null || Boolean.TRUE.equals(jsonRequest.getWebSearch());

        ChatResponse response = aiService.chat(prompt, sessionId, userId, webSearch);
        return ResponseEntity.ok(ApiResponse.success(response, "AI response received"));
    }

    /**
     * Multipart / Form-urlencoded chat invocation for compatibility.
     */
    @PostMapping(consumes = {MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<ApiResponse<ChatResponse>> sendChatMessageFormData(
            @RequestParam("prompt") String prompt,
            @RequestParam(value = "sessionId", required = false) Long sessionId,
            @RequestParam(value = "webSearch", required = false) Boolean webSearch,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        boolean searchEnabled = webSearch == null || Boolean.TRUE.equals(webSearch);

        ChatResponse response = aiService.chat(prompt, sessionId, userId, searchEnabled);
        return ResponseEntity.ok(ApiResponse.success(response, "AI response received"));
    }

    /**
     * Server-Sent Events (SSE) Streaming response endpoint.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChatMessageGet(
            @RequestParam String prompt,
            @RequestParam(required = false) Long sessionId,
            @RequestParam(value = "webSearch", required = false, defaultValue = "true") boolean webSearch,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        return createChatSseEmitter(prompt, sessionId, userId, webSearch);
    }

    @PostMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChatMessagePost(
            @RequestBody ChatRequest req,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        boolean webSearch = req.getWebSearch() == null || Boolean.TRUE.equals(req.getWebSearch());
        return createChatSseEmitter(req.getPrompt(), req.getSessionId(), userId, webSearch);
    }

    private SseEmitter createChatSseEmitter(String prompt, Long sessionId, String userId, boolean webSearch) {
        SseEmitter emitter = new SseEmitter(120000L); // 2 minutes timeout

        CompletableFuture.runAsync(() -> {
            try {
                aiService.streamChat(prompt, sessionId, userId, webSearch, event -> {
                    try {
                        if ("token".equals(event.type())) {
                            emitter.send(SseEmitter.event().name("token").data(event.data()));
                        } else if ("status".equals(event.type())) {
                            emitter.send(SseEmitter.event().name("status").data(event.data()));
                        } else if ("citations".equals(event.type())) {
                            String json = objectMapper.writeValueAsString(event.payload());
                            emitter.send(SseEmitter.event().name("citations").data(json));
                        } else if ("done".equals(event.type())) {
                            emitter.send(SseEmitter.event().name("done").data(event.data()));
                            emitter.complete();
                        } else if ("error".equals(event.type())) {
                            emitter.send(SseEmitter.event().name("error").data(event.data()));
                            emitter.complete();
                        }
                    } catch (Exception sendErr) {
                        log.debug("SSE send error: {}", sendErr.getMessage());
                    }
                });
            } catch (Exception e) {
                log.error("SSE stream failure: {}", e.getMessage());
                try {
                    emitter.send(SseEmitter.event().name("error").data("Stream generation failed: " + e.getMessage()));
                    emitter.complete();
                } catch (Exception ignored) {}
            }
        });

        return emitter;
    }

    /**
     * Edit and resend an earlier message, rewinding the conversation.
     */
    @PostMapping("/messages/{id}/edit")
    public ResponseEntity<ApiResponse<ChatResponse>> editAndResend(
            @PathVariable Long id,
            @RequestBody ChatRequest req,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        boolean webSearch = req.getWebSearch() == null || Boolean.TRUE.equals(req.getWebSearch());

        ChatResponse response = aiService.editAndResend(req.getSessionId(), id, req.getPrompt(), userId, webSearch);
        return ResponseEntity.ok(ApiResponse.success(response, "Message edited and response regenerated"));
    }

    /**
     * Persistent user memory retrieval.
     */
    @GetMapping("/memory")
    public ResponseEntity<ApiResponse<List<AiUserMemory>>> getUserMemories(HttpServletRequest request) {
        String userId = GatewayHeaders.getUserId(request);
        List<AiUserMemory> memories = userMemoryService.getUserMemories(userId);
        return ResponseEntity.ok(ApiResponse.success(memories, "User memories retrieved"));
    }

    @DeleteMapping("/memory/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUserMemory(
            @PathVariable Long id,
            HttpServletRequest request) {
        String userId = GatewayHeaders.getUserId(request);
        userMemoryService.deleteMemory(userId, id);
        return ResponseEntity.ok(ApiResponse.success(null, "Memory deleted"));
    }

    /**
     * Voice endpoints for audio recognition and synthesis.
     */
    @PostMapping(value = "/voice", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<VoiceChatResponse>> sendVoiceMessage(
            @RequestParam("audio") MultipartFile audioFile,
            @RequestParam(value = "sessionId", required = false) Long sessionId,
            HttpServletRequest request) throws IOException {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);

        VoiceChatResponse response = aiService.voiceChat(audioFile.getBytes(), sessionId, userId, userEmail);
        return ResponseEntity.ok(ApiResponse.success(response, "Voice processed successfully"));
    }

    @PostMapping(value = "/speech", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<byte[]> chatWithSpeech(
            @RequestParam(value = "prompt", required = false) String promptParam,
            @RequestParam(value = "sessionId", required = false) Long sessionIdParam,
            @RequestBody(required = false) ChatRequest jsonRequest,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String userEmail = GatewayHeaders.getUserEmail(request);
        String prompt = promptParam != null ? promptParam : (jsonRequest != null ? jsonRequest.getPrompt() : "");
        Long sessionId = sessionIdParam != null ? sessionIdParam : (jsonRequest != null ? jsonRequest.getSessionId() : null);

        ChatResponse textResp = aiService.chat(prompt, sessionId, userId, false);
        VoiceChatResponse voiceResp = aiService.voiceChat(textResp.getResponse().getBytes(), sessionId, userId, userEmail);
        byte[] audio = (voiceResp.getAudioBase64() != null && !voiceResp.getAudioBase64().isBlank())
                ? java.util.Base64.getDecoder().decode(voiceResp.getAudioBase64())
                : new byte[0];

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/wav"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"response.wav\"")
                .body(audio);
    }
}
