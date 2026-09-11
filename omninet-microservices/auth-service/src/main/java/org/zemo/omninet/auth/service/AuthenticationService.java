package org.zemo.omninet.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.auth.dto.AuthResponse;
import org.zemo.omninet.auth.dto.CheckMethodsResponse;
import org.zemo.omninet.auth.dto.UserDto;
import org.zemo.omninet.auth.event.UserEventProducer;
import org.zemo.omninet.auth.model.RefreshToken;
import org.zemo.omninet.auth.model.User;
import org.zemo.omninet.auth.repository.UserRepository;
import org.zemo.omninet.common.exception.AuthenticationException;
import org.zemo.omninet.common.exception.BusinessException;
import org.zemo.omninet.common.exception.ResourceNotFoundException;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserEventProducer userEventProducer;

    @Transactional
    public AuthResponse authenticateUser(String email, String password, String userAgent, String ipAddress) {
        log.info("Attempting email login for: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new AuthenticationException("Invalid email or password"));

        if (!user.hasPassword()) {
            throw new AuthenticationException("Password authentication not configured for this account. Please use " +
                    user.getProvider() + " to sign in, or set up password authentication.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new AuthenticationException("Invalid email or password");
        }

        user.setLastLoginAt(LocalDateTime.now());
        user = userRepository.save(user);

        String accessToken = jwtService.generateAccessToken(user);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user, userAgent, ipAddress);

        return AuthResponse.builder()
                .user(UserDto.fromEntity(user))
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .authMethod("email")
                .hasMultipleProviders(user.isAccountMerged())
                .role(user.getRoles())
                .build();
    }

    @Transactional
    public AuthResponse refreshToken(String refreshTokenStr) {
        Optional<String> newAccessTokenOpt = refreshTokenService.refreshAccessToken(refreshTokenStr);
        if (newAccessTokenOpt.isEmpty()) {
            throw new AuthenticationException("Invalid or expired refresh token");
        }

        String userId = jwtService.getUserIdFromToken(refreshTokenStr);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return AuthResponse.builder()
                .user(UserDto.fromEntity(user))
                .accessToken(newAccessTokenOpt.get())
                .refreshToken(refreshTokenStr)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .authMethod("refresh")
                .hasMultipleProviders(user.isAccountMerged())
                .role(user.getRoles())
                .build();
    }

    @Transactional
    public void logout(String refreshTokenStr) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenService.revokeToken(refreshTokenStr);
        }
    }

    @Transactional
    public void logoutAll(String userId) {
        refreshTokenService.revokeAllUserTokens(userId);
    }

    public CheckMethodsResponse checkAuthenticationMethods(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);

        if (userOpt.isEmpty()) {
            return CheckMethodsResponse.builder()
                    .emailPassword(false)
                    .oauth(false)
                    .providers(Collections.emptyList())
                    .canRegister(true)
                    .accountExists(false)
                    .build();
        }

        User user = userOpt.get();
        return CheckMethodsResponse.builder()
                .emailPassword(user.hasPassword())
                .oauth(!"email".equals(user.getRegistrationSource()))
                .providers(user.getLinkedProviders() != null ?
                        Arrays.asList(user.getLinkedProviders().split(",")) :
                        Collections.singletonList(user.getProvider()))
                .canRegister(false)
                .accountExists(true)
                .build();
    }

    @Transactional
    public void addPasswordToOAuthAccount(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (user.hasPassword()) {
            throw new BusinessException("Account already has a password set. Use change password instead.");
        }

        user.setPassword(passwordEncoder.encode(password));
        String linked = user.getLinkedProviders();
        if (linked == null || !linked.contains("email")) {
            user.setLinkedProviders((linked != null ? linked + "," : "") + "email");
            user.setAccountMerged(true);
        }
        userRepository.save(user);
        log.info("Password successfully added to OAuth account for: {}", email);
        userEventProducer.publishUserUpdated(user.getId(), user.getEmail(), user.getName(), user.getAvatarUrl(), "password,linkedProviders");
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + email));

        if (!user.hasPassword()) {
            throw new BusinessException("Account does not have a password configured yet.");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new AuthenticationException("Current password does not match");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        log.info("Password successfully changed for user: {}", email);
    }
}
