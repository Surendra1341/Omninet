package org.zemo.omninet.ai.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.ai.dto.ChatMessageDto;
import org.zemo.omninet.ai.dto.ChatResponse;
import org.zemo.omninet.ai.dto.SpeechRecognizeResponse;
import org.zemo.omninet.ai.dto.VoiceChatResponse;
import org.zemo.omninet.ai.entity.ChatMessage;
import org.zemo.omninet.ai.entity.ChatSession;
import org.zemo.omninet.ai.event.AiEventProducer;
import org.zemo.omninet.ai.grpc.SpeechGrpcClient;
import org.zemo.omninet.ai.grpc.StorageGrpcClient;
import org.zemo.omninet.ai.provider.AiProvider;
import org.zemo.omninet.ai.provider.AiProviderFactory;
import org.zemo.omninet.proto.ai.RecognizeSpeechResponse;

import java.util.*;
import java.util.function.Consumer;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AiProviderFactory aiProviderFactory;
    private final ChatSessionService sessionService;
    private final UserMemoryService userMemoryService;
    private final SpeechGrpcClient speechGrpcClient;
    private final StorageGrpcClient storageGrpcClient;
    private final AiEventProducer aiEventProducer;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final int MAX_CONTEXT_MESSAGES = 16;

    @Transactional
    public ChatResponse chat(String prompt, Long sessionId, String userId) {
        return chat(prompt, sessionId, userId, true);
    }

    @Transactional
    public ChatResponse chat(String prompt, Long sessionId, String userId, boolean webSearchEnabled) {
        ChatSession session = sessionId != null ?
                sessionService.getSessionEntity(sessionId, userId) :
                sessionService.createSession(userId, "New Conversation");

        // 1. Prepare sliding context from PRIOR messages BEFORE saving current message
        List<ChatMessage> history = sessionService.getSlidingWindowMessages(session, MAX_CONTEXT_MESSAGES);

        // 2. Record User Message
        ChatMessage userMsg = sessionService.addMessage(session, ChatMessage.MessageType.USER_TEXT, prompt, null);

        // 3. Extract user preferences/identity in the background
        userMemoryService.extractAndSaveMemories(userId, prompt);

        // 4. Prepare system prompt with memory
        String systemInstruction = userMemoryService.buildMemorySystemPrompt(userId);

        // 5. Generate response via active AI engine with tool calling
        AiProvider.GenResult result = aiProviderFactory.generateTextWithCitations(prompt, history, systemInstruction, webSearchEnabled);
        String answer = result.text();
        if (answer == null || answer.isBlank()) {
            answer = "I processed your request, but could not formulate a text response. Please try rephrasing.";
        }
        List<Map<String, String>> citations = result.citations();

        String citationsJson = null;
        try {
            if (citations != null && !citations.isEmpty()) {
                citationsJson = objectMapper.writeValueAsString(citations);
            }
        } catch (Exception e) {
            log.warn("Failed to serialize citations: {}", e.getMessage());
        }

        // 6. Record AI Message
        ChatMessage aiMsg = sessionService.addMessage(session, ChatMessage.MessageType.AI_TEXT, answer, null, citationsJson);

        // 7. Audit Event
        aiEventProducer.publishAiInteraction(userId, session.getId(), "TEXT_CHAT", result.modelUsed());

        return ChatResponse.builder()
                .response(answer)
                .sessionId(session.getId())
                .model(result.modelUsed())
                .tokensUsed(answer.length() / 4)
                .citations(citations)
                .userMessage(ChatMessageDto.fromEntity(userMsg))
                .aiMessage(ChatMessageDto.fromEntity(aiMsg))
                .build();
    }

    @Transactional
    public void streamChat(String prompt, Long sessionId, String userId, boolean webSearchEnabled, Consumer<AiProvider.StreamEvent> consumer) {
        ChatSession session = sessionId != null ?
                sessionService.getSessionEntity(sessionId, userId) :
                sessionService.createSession(userId, "New Conversation");

        // 1. Get previous history BEFORE adding current prompt
        List<ChatMessage> history = sessionService.getSlidingWindowMessages(session, MAX_CONTEXT_MESSAGES);

        // 2. Record User Message
        sessionService.addMessage(session, ChatMessage.MessageType.USER_TEXT, prompt, null);
        userMemoryService.extractAndSaveMemories(userId, prompt);

        String systemInstruction = userMemoryService.buildMemorySystemPrompt(userId);

        StringBuilder fullTextAccumulator = new StringBuilder();
        List<Map<String, String>> collectedCitations = new ArrayList<>();

        aiProviderFactory.streamText(prompt, history, systemInstruction, webSearchEnabled, event -> {
            if ("token".equals(event.type())) {
                fullTextAccumulator.append(event.data());
            } else if ("citations".equals(event.type()) && event.payload() instanceof List) {
                collectedCitations.addAll((List<Map<String, String>>) event.payload());
            }
            try {
                consumer.accept(event);
            } catch (Exception sendErr) {
                // Client may have closed tab or navigated to other session; continue stream generation to save result
                log.debug("Consumer not receiving: {}", sendErr.getMessage());
            }

            // Once generation completes, persist AI message in database (even if client disconnected)
            if ("done".equals(event.type())) {
                String finalText = fullTextAccumulator.toString();
                if (finalText.isBlank() && event.data() != null && !event.data().isBlank()) {
                    finalText = event.data();
                }
                if (finalText.isBlank()) {
                    finalText = "I processed your request, but could not generate a response. Please try again.";
                }

                String citationsJson = null;
                try {
                    if (!collectedCitations.isEmpty()) {
                        citationsJson = objectMapper.writeValueAsString(collectedCitations);
                    }
                } catch (Exception ignored) {}

                sessionService.addMessage(session, ChatMessage.MessageType.AI_TEXT, finalText, null, citationsJson);
                aiEventProducer.publishAiInteraction(userId, session.getId(), "STREAM_CHAT", aiProviderFactory.getProviderName());
            }
        });
    }

    @Transactional
    public ChatResponse editAndResend(Long sessionId, Long messageId, String newPrompt, String userId, boolean webSearchEnabled) {
        ChatSession session = sessionService.getSessionEntity(sessionId, userId);
        ChatMessage editedUserMsg = sessionService.editAndPrepareResend(sessionId, messageId, newPrompt, userId);

        userMemoryService.extractAndSaveMemories(userId, newPrompt);

        List<ChatMessage> history = sessionService.getSlidingWindowMessages(session, MAX_CONTEXT_MESSAGES);
        String systemInstruction = userMemoryService.buildMemorySystemPrompt(userId);

        AiProvider.GenResult result = aiProviderFactory.generateTextWithCitations(newPrompt, history, systemInstruction, webSearchEnabled);
        String answer = result.text();
        List<Map<String, String>> citations = result.citations();

        String citationsJson = null;
        try {
            if (citations != null && !citations.isEmpty()) {
                citationsJson = objectMapper.writeValueAsString(citations);
            }
        } catch (Exception ignored) {}

        ChatMessage aiMsg = sessionService.addMessage(session, ChatMessage.MessageType.AI_TEXT, answer, null, citationsJson);
        aiEventProducer.publishAiInteraction(userId, session.getId(), "EDIT_RESEND", result.modelUsed());

        return ChatResponse.builder()
                .response(answer)
                .sessionId(session.getId())
                .model(result.modelUsed())
                .tokensUsed(answer.length() / 4)
                .citations(citations)
                .userMessage(ChatMessageDto.fromEntity(editedUserMsg))
                .aiMessage(ChatMessageDto.fromEntity(aiMsg))
                .build();
    }

    @Transactional
    public VoiceChatResponse voiceChat(byte[] audioBytes, Long sessionId, String userId, String userEmail) {
        RecognizeSpeechResponse speechResponse = speechGrpcClient.recognizeSpeech(audioBytes, "wav", "en-US");
        String transcribedPrompt = speechResponse.getText();

        ChatSession session = sessionId != null ?
                sessionService.getSessionEntity(sessionId, userId) :
                sessionService.createSession(userId, "Voice: " + transcribedPrompt);

        String userAudioFilename = "voice_in_" + UUID.randomUUID() + ".wav";
        String userAudioPath = storageGrpcClient.saveAudioFile(userEmail, userAudioFilename, audioBytes, "audio/wav");

        sessionService.addMessage(session, ChatMessage.MessageType.USER_AUDIO, transcribedPrompt, userAudioPath);

        List<ChatMessage> history = sessionService.getSlidingWindowMessages(session, MAX_CONTEXT_MESSAGES);
        String systemInstruction = userMemoryService.buildMemorySystemPrompt(userId);

        AiProvider.GenResult genResult = aiProviderFactory.generateTextWithCitations(transcribedPrompt, history, systemInstruction, false);
        String answerText = genResult.text();

        byte[] answerAudio = speechGrpcClient.synthesizeSpeech(answerText, "en-US", "default");
        String aiAudioFilename = "voice_out_" + UUID.randomUUID() + ".wav";
        String aiAudioPath = storageGrpcClient.saveAudioFile(userEmail, aiAudioFilename, answerAudio, "audio/wav");

        sessionService.addMessage(session, ChatMessage.MessageType.AI_AUDIO, answerText, aiAudioPath);
        aiEventProducer.publishAiInteraction(userId, session.getId(), "VOICE_CHAT", genResult.modelUsed());

        String base64Audio = answerAudio.length > 0 ? Base64.getEncoder().encodeToString(answerAudio) : "";

        return VoiceChatResponse.builder()
                .textResponse(answerText)
                .audioBase64(base64Audio)
                .audioFilePath(aiAudioPath)
                .sessionId(session.getId())
                .build();
    }

    public SpeechRecognizeResponse transcribeAudio(byte[] audioBytes) {
        RecognizeSpeechResponse resp = speechGrpcClient.recognizeSpeech(audioBytes, "wav", "en-US");
        return SpeechRecognizeResponse.builder()
                .text(resp.getText())
                .confidence(resp.getConfidence())
                .build();
    }

    public byte[] synthesizeSpeech(String text) {
        return speechGrpcClient.synthesizeSpeech(text, "en-US", "default");
    }
}
