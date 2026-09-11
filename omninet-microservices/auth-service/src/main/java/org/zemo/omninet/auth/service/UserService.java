package org.zemo.omninet.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.auth.dto.UserDto;
import org.zemo.omninet.auth.event.UserEventProducer;
import org.zemo.omninet.auth.model.User;
import org.zemo.omninet.auth.repository.UserRepository;
import org.zemo.omninet.common.exception.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final UserEventProducer userEventProducer;

    @Transactional
    public User saveOrUpdateOAuthUser(OAuth2User principal, String registrationId) {
        String email = principal.getAttribute("email");
        String name = principal.getAttribute("name");
        String avatarUrl = getAvatarUrl(principal);

        if (email == null || email.isBlank()) {
            // Some providers like GitHub might use login if name is null
            String login = principal.getAttribute("login");
            email = login + "@github.user";
            if (name == null || name.isBlank()) {
                name = login;
            }
        }

        Optional<User> existingUserOpt = userRepository.findByEmail(email);

        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            existing.setLastLoginAt(LocalDateTime.now());
            if (avatarUrl != null && !avatarUrl.isBlank()) {
                existing.setAvatarUrl(avatarUrl);
            }
            if (name != null && !name.isBlank()) {
                existing.setName(name);
            }
            // Add provider to linkedProviders if not present
            if (existing.getLinkedProviders() == null || !existing.getLinkedProviders().contains(registrationId)) {
                existing.setLinkedProviders((existing.getLinkedProviders() != null ? existing.getLinkedProviders() + "," : "") + registrationId);
                existing.setAccountMerged(true);
            }
            User saved = userRepository.save(existing);
            userEventProducer.publishUserUpdated(saved.getId(), saved.getEmail(), saved.getName(), saved.getAvatarUrl(), "lastLoginAt,avatarUrl");
            return saved;
        }

        // New OAuth user
        User newUser = User.fromOAuth(email, name, avatarUrl, registrationId);
        User saved = userRepository.save(newUser);
        log.info("Created new user from OAuth provider {}: id={}, email={}", registrationId, saved.getId(), saved.getEmail());
        userEventProducer.publishUserCreated(saved.getId(), saved.getEmail(), saved.getName(), registrationId, saved.getAvatarUrl());
        return saved;
    }

    public User getUserById(String id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + id));
    }

    public Optional<User> findById(String id) {
        return userRepository.findById(id);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public List<User> getUsersByIds(List<String> ids) {
        return userRepository.findByIdIn(ids);
    }

    @Transactional
    public User saveUser(User user) {
        return userRepository.save(user);
    }

    @Transactional
    public UserDto updateProfile(String userId, String name, String avatarUrl) {
        User user = getUserById(userId);
        boolean changed = false;
        StringBuilder updatedFields = new StringBuilder();

        if (name != null && !name.isBlank() && !name.equals(user.getName())) {
            user.setName(name);
            changed = true;
            updatedFields.append("name,");
        }
        if (avatarUrl != null && !avatarUrl.equals(user.getAvatarUrl())) {
            user.setAvatarUrl(avatarUrl);
            changed = true;
            updatedFields.append("avatarUrl,");
        }

        if (changed) {
            user = userRepository.save(user);
            userEventProducer.publishUserUpdated(user.getId(), user.getEmail(), user.getName(),
                    user.getAvatarUrl(), updatedFields.toString());
        }

        return UserDto.fromEntity(user);
    }

    @Transactional
    public void updateStorageUsage(String userId, long deltaBytes) {
        userRepository.findById(userId).ifPresent(user -> {
            long newUsage = Math.max(0L, (user.getUsedStorageBytes() != null ? user.getUsedStorageBytes() : 0L) + deltaBytes);
            user.setUsedStorageBytes(newUsage);
            userRepository.save(user);
            log.info("Updated storage usage for user {}: {} bytes", userId, newUsage);
        });
    }

    private String getAvatarUrl(OAuth2User principal) {
        String avatarUrl = principal.getAttribute("avatar_url"); // GitHub
        if (avatarUrl == null) {
            avatarUrl = principal.getAttribute("picture"); // Google
        }
        return avatarUrl;
    }
}
