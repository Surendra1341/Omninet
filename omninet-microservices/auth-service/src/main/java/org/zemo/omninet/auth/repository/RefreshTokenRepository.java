package org.zemo.omninet.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.zemo.omninet.auth.model.RefreshToken;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, String> {
    Optional<RefreshToken> findByToken(String token);
    List<RefreshToken> findByUserId(String userId);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("UPDATE RefreshToken r SET r.revoked = true WHERE r.userId = :userId")
    void revokeAllByUserId(String userId);

    @Modifying
    @org.springframework.transaction.annotation.Transactional
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :dateTime OR r.revoked = true")
    void deleteExpiredOrRevoked(LocalDateTime dateTime);
}
