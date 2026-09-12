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

import java.util.ArrayList;
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
        getSessionEntity(sessionId, userId);
        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(ChatMessageDto::fromEntity)
                .collect(Collectors.toList());
    }

    public List<ChatMessage> getRawSessionMessages(ChatSession session) {
        return chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());
    }

    public List<ChatMessage> getSlidingWindowMessages(ChatSession session, int maxCount) {
        List<ChatMessage> all = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());
        if (all.size() <= maxCount) {
            return all;
        }
        return all.subList(all.size() - maxCount, all.size());
    }

    @Transactional
    public ChatMessage addMessage(ChatSession session, ChatMessage.MessageType type, String content, String audioFilePath) {
        return addMessage(session, type, content, audioFilePath, null);
    }

    @Transactional
    public ChatMessage addMessage(ChatSession session, ChatMessage.MessageType type, String content, String audioFilePath, String citationsJson) {
        ChatMessage message = ChatMessage.builder()
                .chatSession(session)
                .type(type)
                .content(content)
                .audioFilePath(audioFilePath)
                .citations(citationsJson)
                .build();

        ChatMessage saved = chatMessageRepository.save(message);

        // Update session title automatically if this is the first message
        if ("New Conversation".equals(session.getTitle()) && content != null && !content.isBlank()) {
            String snippet = content.length() > 32 ? content.substring(0, 32) + "..." : content;
            session.setTitle(snippet);
            chatSessionRepository.save(session);
        }

        return saved;
    }

    @Transactional
    public ChatMessage editAndPrepareResend(Long sessionId, Long messageId, String newContent, String userId) {
        ChatSession session = getSessionEntity(sessionId, userId);
        List<ChatMessage> all = chatMessageRepository.findByChatSessionIdOrderByCreatedAtAsc(session.getId());

        int targetIndex = -1;
        for (int i = 0; i < all.size(); i++) {
            if (all.get(i).getId().equals(messageId)) {
                targetIndex = i;
                break;
            }
        }

        if (targetIndex == -1) {
            throw new ResourceNotFoundException("Message not found in session: " + messageId);
        }

        ChatMessage targetMsg = all.get(targetIndex);
        targetMsg.setContent(newContent);
        targetMsg.setIsEdited(true);
        chatMessageRepository.save(targetMsg);

        // Truncate/delete all subsequent messages after this point so a fresh AI response is generated
        if (targetIndex < all.size() - 1) {
            List<ChatMessage> toDelete = new ArrayList<>(all.subList(targetIndex + 1, all.size()));
            chatMessageRepository.deleteAll(toDelete);
        }

        return targetMsg;
    }

    @Transactional
    public void updateSessionTitle(Long sessionId, String title, String userId) {
        ChatSession session = getSessionEntity(sessionId, userId);
        if (title != null && !title.isBlank()) {
            session.setTitle(title.trim());
            chatSessionRepository.save(session);
        }
    }

    @Transactional
    public void deleteSession(Long sessionId, String userId) {
        ChatSession session = getSessionEntity(sessionId, userId);
        chatSessionRepository.delete(session);
        log.info("Deleted chat session id={} for user {}", sessionId, userId);
    }
}
