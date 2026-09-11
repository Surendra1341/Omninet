package org.zemo.omninet.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.auth.model.EmailVerification;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface EmailVerificationRepository extends JpaRepository<EmailVerification, String> {
    Optional<EmailVerification> findTopByEmailOrderByCreatedAtDesc(String email);
    Optional<EmailVerification> findTopByEmailAndOtpOrderByCreatedAtDesc(String email, String otp);

    @Modifying
    @Transactional
    @Query("DELETE FROM EmailVerification ev WHERE ev.expiresAt < :dateTime OR ev.used = true")
    void deleteExpiredOrUsed(LocalDateTime dateTime);

    @Modifying
    @Transactional
    void deleteByEmail(String email);
}
