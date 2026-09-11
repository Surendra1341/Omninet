package org.zemo.omninet.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.ai.dto.ChatMessageDto;
import org.zemo.omninet.ai.dto.ChatSessionDto;
import org.zemo.omninet.ai.entity.ChatMessage;
import org.zemo.omninet.ai.entity.ChatSession;
import org.zemo.omninet.ai.repository.ChatMessageRepository;
import org.zemo.omninet.ai.repository.ChatSessionRepository;
import org.zemo.omninet.common.exception.ResourceNotFoundException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatSessionService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional
    public ChatSession createSession(String userId, String title) {
        String sessionTitle = (title != null && !title.isBlank()) ? title : "New Conversation";
        ChatSession session = ChatSession.builder()
                .userId(userId)
                .title(sessionTitle)
                .build();
        return chatSessionRepository.save(session);
    }

    public List<ChatSessionDto> getUserSessions(String userId) {
        return chatSessionRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(ChatSessionDto::fromEntity)
                .collect(Collectors.toList());
    }

    public ChatSession getSessionEntity(Long sessionId, String userId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Chat session not found with id: " + sessionId));
    }

    public List<ChatMessageDto> getSessionMessages(Long sessionId, String userId) {
        // Validate access
        getSessionEntity(sessionId, userId);
        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(ChatMessageDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ChatMessage> getRawSessionMessages(ChatSession session) {
        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());
    }

    @Transactional
    public ChatMessage addMessage(ChatSession session, ChatMessage.MessageType type, String content, String audioFilePath) {
        ChatMessage message = ChatMessage.builder()
                .chatSession(session)
                .type(type)
                .content(content)
                .audioFilePath(audioFilePath)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        // Update session title automatically if this is the first message
        if ("New Conversation".equals(session.getTitle()) && content != null && !content.isBlank()) {
            String snippet = content.length() > 30 ? content.substring(0, 30) + "..." : content;
            session.setTitle(snippet);
            chatSessionRepository.save(session);
        }

        return saved;
    }

    @Transactional
    public void deleteSession(Long sessionId, String userId) {
        ChatSession session = getSessionEntity(sessionId, userId);
        chatSessionRepository.delete(session);
        log.info("Deleted chat session id={} for user {}", sessionId, userId);
    }
}
