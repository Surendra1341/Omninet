package org.zemo.omninet.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
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

import java.util.Base64;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final AiProviderFactory aiProviderFactory;
    private final ChatSessionService sessionService;
    private final SpeechGrpcClient speechGrpcClient;
    private final StorageGrpcClient storageGrpcClient;
    private final AiEventProducer aiEventProducer;

    @Transactional
    public ChatResponse chat(String prompt, Long sessionId, String userId) {
        ChatSession session = sessionId != null ?
                sessionService.getSessionEntity(sessionId, userId) :
                sessionService.createSession(userId, "New Conversation");

        // Record User Message
        sessionService.addMessage(session, ChatMessage.MessageType.USER_TEXT, prompt, null);

        // Fetch recent history
        List<ChatMessage> history = sessionService.getRawSessionMessages(session);

        // Generate response via active AI engine
        AiProvider provider = aiProviderFactory.getProvider();
        String answer = provider.generateText(prompt, history);

        // Record AI Message
        sessionService.addMessage(session, ChatMessage.MessageType.AI_TEXT, answer, null);

        // Audit Event
        aiEventProducer.publishAiInteraction(userId, session.getId(), "TEXT_CHAT", provider.getProviderName());

        return ChatResponse.builder()
                .response(answer)
                .sessionId(session.getId())
                .model(provider.getProviderName())
                .tokensUsed(answer.length() / 4)
                .build();
    }

    @Transactional
    public VoiceChatResponse voiceChat(byte[] audioBytes, Long sessionId, String userId, String userEmail) {
        // 1. Transcribe audio to text via speech service
        RecognizeSpeechResponse speechResponse = speechGrpcClient.recognizeSpeech(audioBytes, "wav", "en-US");
        String transcribedPrompt = speechResponse.getText();

        ChatSession session = sessionId != null ?
                sessionService.getSessionEntity(sessionId, userId) :
                sessionService.createSession(userId, "Voice: " + transcribedPrompt);

        // Save incoming audio to storage-service via gRPC
        String userAudioFilename = "voice_in_" + UUID.randomUUID() + ".wav";
        String userAudioPath = storageGrpcClient.saveAudioFile(userEmail, userAudioFilename, audioBytes, "audio/wav");

        // Record User Audio Message
        sessionService.addMessage(session, ChatMessage.MessageType.USER_AUDIO, transcribedPrompt, userAudioPath);

        // 2. Generate answer via AI engine
        AiProvider provider = aiProviderFactory.getProvider();
        List<ChatMessage> history = sessionService.getRawSessionMessages(session);
        String answerText = provider.generateText(transcribedPrompt, history);

        // 3. Synthesize response to audio via speech service
        byte[] answerAudio = speechGrpcClient.synthesizeSpeech(answerText, "en-US", "default");

        // Save outgoing audio to storage-service via gRPC
        String aiAudioFilename = "voice_out_" + UUID.randomUUID() + ".wav";
        String aiAudioPath = storageGrpcClient.saveAudioFile(userEmail, aiAudioFilename, answerAudio, "audio/wav");

        // Record AI Audio Message
        sessionService.addMessage(session, ChatMessage.MessageType.AI_AUDIO, answerText, aiAudioPath);

        aiEventProducer.publishAiInteraction(userId, session.getId(), "VOICE_CHAT", provider.getProviderName());

        String base64Audio = answerAudio.length > 0 ? Base64.getEncoder().encodeToString(answerAudio) : "";

        return VoiceChatResponse.builder()
                .textResponse(answerText)
                .audioBase64(base64Audio)
                .audioFilePath(aiAudioPath)
                .sessionId(session.getId())
                .build();
    }

    public SpeechRecognizeResponse transcribeAudio(byte[] audioBytes) {
        RecognizeSpeechResponse res = speechGrpcClient.recognizeSpeech(audioBytes, "wav", "en-US");
        return SpeechRecognizeResponse.builder()
                .text(res.getText())
                .confidence(res.getConfidence())
                .success(res.getSuccess())
                .build();
    }

    public byte[] synthesizeSpeech(String text) {
        return speechGrpcClient.synthesizeSpeech(text, "en-US", "default");
    }
}
