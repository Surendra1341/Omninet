package org.zemo.omninet.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.auth.model.RefreshToken;
import org.zemo.omninet.auth.model.User;
import org.zemo.omninet.auth.repository.RefreshTokenRepository;
import org.zemo.omninet.auth.repository.UserRepository;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    private static final int MAX_ACTIVE_TOKENS_PER_USER = 5;

    @Transactional
    public RefreshToken createRefreshToken(User user, String userAgent, String ipAddress) {
        // Enforce maximum active tokens per user (prune old ones)
        cleanupExcessiveTokens(user.getId(), MAX_ACTIVE_TOKENS_PER_USER - 1);

        String tokenString = jwtService.generateRefreshToken(user);
        LocalDateTime expiresAt = LocalDateTime.now().plus(jwtService.getRefreshTokenExpiration(), ChronoUnit.MILLIS);

        RefreshToken refreshToken = RefreshToken.builder()
                .token(tokenString)
                .userId(user.getId())
                .createdAt(LocalDateTime.now())
                .expiresAt(expiresAt)
                .revoked(false)
                .userAgent(userAgent)
                .ipAddress(ipAddress)
                .build();

        return refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public Optional<String> refreshAccessToken(String refreshTokenString) {
        try {
            if (!jwtService.isTokenValid(refreshTokenString)) {
                log.warn("Invalid or expired refresh token");
                return Optional.empty();
            }

            Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(refreshTokenString);
            if (tokenOpt.isEmpty()) {
                log.warn("Refresh token not found in database");
                return Optional.empty();
            }

            RefreshToken token = tokenOpt.get();
            if (!token.isValid()) {
                log.warn("Refresh token is revoked or expired: id={}", token.getId());
                return Optional.empty();
            }

            Optional<User> userOpt = userRepository.findById(token.getUserId());
            if (userOpt.isEmpty()) {
                log.warn("User {} not found for refresh token", token.getUserId());
                return Optional.empty();
            }

            User user = userOpt.get();
            String newAccessToken = jwtService.generateAccessToken(user);
            log.info("Refreshed access token successfully for user: {}", user.getEmail());
            return Optional.of(newAccessToken);

        } catch (Exception e) {
            log.error("Error refreshing token: {}", e.getMessage(), e);
            return Optional.empty();
        }
    }

    @Transactional
    public void revokeToken(String refreshTokenString) {
        refreshTokenRepository.findByToken(refreshTokenString).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
            jwtService.blacklistToken(refreshTokenString);
            log.info("Revoked refresh token for user {}", token.getUserId());
        });
    }

    @Transactional
    public void revokeAllUserTokens(String userId) {
        List<RefreshToken> tokens = refreshTokenRepository.findByUserId(userId);
        for (RefreshToken token : tokens) {
            token.setRevoked(true);
            jwtService.blacklistToken(token.getToken());
        }
        refreshTokenRepository.saveAll(tokens);
        log.info("Revoked all {} refresh tokens for user {}", tokens.size(), userId);
    }

    private void cleanupExcessiveTokens(String userId, int maxTokens) {
        List<RefreshToken> activeTokens = refreshTokenRepository.findByUserId(userId)
                .stream()
                .filter(RefreshToken::isValid)
                .sorted(Comparator.comparing(RefreshToken::getCreatedAt))
                .toList();

        if (activeTokens.size() > maxTokens) {
            int tokensToRemove = activeTokens.size() - maxTokens;
            List<RefreshToken> toRevoke = activeTokens.subList(0, tokensToRemove);
            toRevoke.forEach(t -> t.setRevoked(true));
            refreshTokenRepository.saveAll(toRevoke);
            log.info("Revoked {} oldest refresh tokens for user {}", tokensToRemove, userId);
        }
    }
}
