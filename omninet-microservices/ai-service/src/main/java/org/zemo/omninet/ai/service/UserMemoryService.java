package org.zemo.omninet.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.ai.entity.AiUserMemory;
import org.zemo.omninet.ai.repository.AiUserMemoryRepository;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserMemoryService {

    private final AiUserMemoryRepository memoryRepository;

    public List<AiUserMemory> getUserMemories(String userId) {
        return memoryRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    @Transactional
    public AiUserMemory saveMemory(String userId, String key, String value, String category) {
        return memoryRepository.findByUserIdAndMemoryKey(userId, key)
                .map(existing -> {
                    existing.setMemoryValue(value);
                    if (category != null) existing.setCategory(category);
                    return memoryRepository.save(existing);
                })
                .orElseGet(() -> memoryRepository.save(AiUserMemory.builder()
                        .userId(userId)
                        .memoryKey(key)
                        .memoryValue(value)
                        .category(category != null ? category : "general")
                        .build()));
    }

    @Transactional
    public void deleteMemory(String userId, Long id) {
        memoryRepository.deleteByUserIdAndId(userId, id);
    }

    public String buildMemorySystemPrompt(String userId) {
        if (userId == null || userId.isBlank()) return "";

        List<AiUserMemory> memories = getUserMemories(userId);
        if (memories.isEmpty()) return "";

        StringBuilder sb = new StringBuilder("Known user context and preferences across sessions:\n");
        for (AiUserMemory mem : memories) {
            sb.append("- ").append(mem.getMemoryKey()).append(": ").append(mem.getMemoryValue()).append("\n");
        }
        sb.append("Use these details naturally when relevant without unnecessarily repeating them.");
        return sb.toString();
    }

    /**
     * Light pattern-based memory extraction for user preference and identity declarations.
     */
    @Transactional
    public void extractAndSaveMemories(String userId, String userPrompt) {
        if (userId == null || userPrompt == null || userPrompt.isBlank()) return;

        try {
            // "My name is X" or "I am X"
            Pattern namePattern = Pattern.compile("(?i)(?:my name is|call me)\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)?)");
            Matcher nameMatcher = namePattern.matcher(userPrompt);
            if (nameMatcher.find()) {
                saveMemory(userId, "Preferred Name", nameMatcher.group(1).trim(), "identity");
            }

            // "I prefer X" or "I like X"
            Pattern prefPattern = Pattern.compile("(?i)(?:i prefer|my favorite language is|i specialize in)\\s+([^.,;!]+)");
            Matcher prefMatcher = prefPattern.matcher(userPrompt);
            if (prefMatcher.find()) {
                String val = prefMatcher.group(1).trim();
                if (val.length() < 60) {
                    saveMemory(userId, "Preference", val, "preference");
                }
            }
        } catch (Exception e) {
            log.debug("Memory extraction notice: {}", e.getMessage());
        }
    }
}
