package org.zemo.omninet.ai.controller;

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
import org.zemo.omninet.ai.service.AiService;
import org.zemo.omninet.common.dto.ApiResponse;
import org.zemo.omninet.common.security.GatewayHeaders;

import java.io.IOException;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping({"/api/v1/ai/chat", "/api/ai/chat"})
@RequiredArgsConstructor
@Slf4j
public class AiChatController {

    private final AiService aiService;

    @PostMapping(consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.MULTIPART_FORM_DATA_VALUE, MediaType.APPLICATION_FORM_URLENCODED_VALUE})
    public ResponseEntity<ApiResponse<ChatResponse>> sendChatMessage(
            @RequestParam(value = "prompt", required = false) String promptParam,
            @RequestParam(value = "sessionId", required = false) Long sessionIdParam,
            @RequestBody(required = false) ChatRequest jsonRequest,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        String prompt = promptParam != null ? promptParam : (jsonRequest != null ? jsonRequest.getPrompt() : "");
        Long sessionId = sessionIdParam != null ? sessionIdParam : (jsonRequest != null ? jsonRequest.getSessionId() : null);

        ChatResponse response = aiService.chat(prompt, sessionId, userId);
        return ResponseEntity.ok(ApiResponse.success(response, "AI response received"));
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

        ChatResponse textResp = aiService.chat(prompt, sessionId, userId);
        VoiceChatResponse voiceResp = aiService.voiceChat(textResp.getResponse().getBytes(), sessionId, userId, userEmail);
        byte[] audio = (voiceResp.getAudioBase64() != null && !voiceResp.getAudioBase64().isBlank())
                ? java.util.Base64.getDecoder().decode(voiceResp.getAudioBase64())
                : new byte[0];

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("audio/wav"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"response.wav\"")
                .body(audio);
    }

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

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamChatMessage(
            @RequestParam String prompt,
            @RequestParam(required = false) Long sessionId,
            HttpServletRequest request) {

        String userId = GatewayHeaders.getUserId(request);
        SseEmitter emitter = new SseEmitter(60000L);

        CompletableFuture.runAsync(() -> {
            try {
                ChatResponse response = aiService.chat(prompt, sessionId, userId);
                String fullAnswer = response.getResponse();

                // Stream in word tokens to simulate chunked generative responses
                String[] words = fullAnswer.split(" ");
                for (int i = 0; i < words.length; i++) {
                    emitter.send(SseEmitter.event().data(words[i] + (i < words.length - 1 ? " " : "")));
                    Thread.sleep(30);
                }
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        });

        return emitter;
    }
}
