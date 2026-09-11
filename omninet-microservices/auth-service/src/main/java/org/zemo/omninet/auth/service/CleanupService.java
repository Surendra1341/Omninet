package org.zemo.omninet.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.auth.repository.EmailVerificationRepository;
import org.zemo.omninet.auth.repository.PendingUserRepository;
import org.zemo.omninet.auth.repository.RefreshTokenRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class CleanupService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final PendingUserRepository pendingUserRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            performCleanup();
        } catch (Exception e) {
            log.warn("Initial cleanup postponed: {}", e.getMessage());
        }
    }

    @Scheduled(initialDelayString = "${cleanup.initial-delay-ms:15000}", fixedDelayString = "${cleanup.fixed-delay-ms:3600000}")
    public void scheduledCleanup() {
        try {
            performCleanup();
        } catch (Exception e) {
            log.error("Error during scheduled token/OTP cleanup: {}", e.getMessage(), e);
        }
    }

    @Transactional
    public void performCleanup() {
        LocalDateTime now = LocalDateTime.now();
        try {
            emailVerificationRepository.deleteExpiredOrUsed(now);
            pendingUserRepository.deleteByExpiresAtBefore(now);
            refreshTokenRepository.deleteExpiredOrRevoked(now);
            log.info("Cleaned up expired OTPs, pending users, and revoked refresh tokens");
        } catch (Exception ex) {
            log.warn("Cleanup skipped (schema or DB not ready): {}", ex.getMessage());
        }
    }
}
