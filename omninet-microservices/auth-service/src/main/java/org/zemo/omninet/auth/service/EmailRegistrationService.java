package org.zemo.omninet.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.zemo.omninet.auth.dto.AuthResponse;
import org.zemo.omninet.auth.dto.UserDto;
import org.zemo.omninet.auth.event.UserEventProducer;
import org.zemo.omninet.auth.model.EmailVerification;
import org.zemo.omninet.auth.model.PendingUser;
import org.zemo.omninet.auth.model.RefreshToken;
import org.zemo.omninet.auth.model.User;
import org.zemo.omninet.auth.repository.EmailVerificationRepository;
import org.zemo.omninet.auth.repository.PendingUserRepository;
import org.zemo.omninet.auth.repository.UserRepository;
import org.zemo.omninet.common.exception.BusinessException;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailRegistrationService {

    private final EmailVerificationRepository emailVerificationRepository;
    private final PendingUserRepository pendingUserRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserEventProducer userEventProducer;
    private final RedisTemplate<String, Object> redisTemplate;

    private final SecureRandom secureRandom = new SecureRandom();

    private static final String VERIFY_TOKEN_PREFIX = "reg:token:";
    private static final String OTP_PREFIX = "reg:otp:";

    @Transactional
    public Map<String, Object> initiateEmailRegistration(String email) {
        log.info("Initiating email registration for: {}", email);

        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        if (existingUserOpt.isPresent()) {
            User existing = existingUserOpt.get();
            if ("email".equals(existing.getRegistrationSource()) ||
                (existing.getLinkedProviders() != null && existing.getLinkedProviders().contains("email"))) {
                throw new BusinessException("An account with this email already exists. Please log in.");
            }
        }

        // Generate 6-digit OTP
        String otp = String.format("%06d", secureRandom.nextInt(1000000));

        // Save in DB
        EmailVerification verification = new EmailVerification(email, otp, 15);
        emailVerificationRepository.save(verification);

        // Cache in Redis for quick lookup
        redisTemplate.opsForValue().set(OTP_PREFIX + email, otp, Duration.ofMinutes(15));

        // Send Email
        emailService.sendOtpEmail(email, otp);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Verification code sent to " + email);
        response.put("email", email);
        return response;
    }

    @Transactional
    public Map<String, Object> verifyOtp(String email, String otp) {
        log.info("Verifying OTP for email: {}", email);

        Optional<EmailVerification> verificationOpt = emailVerificationRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (verificationOpt.isEmpty()) {
            throw new BusinessException("No verification request found for this email");
        }

        EmailVerification verification = verificationOpt.get();
        if (verification.isExpired() || verification.isUsed()) {
            throw new BusinessException("Verification code has expired or was already used");
        }

        if (!verification.getOtp().equals(otp)) {
            verification.setAttemptCount(verification.getAttemptCount() + 1);
            emailVerificationRepository.save(verification);
            throw new BusinessException("Invalid verification code");
        }

        verification.setVerified(true);
        verification.setUsed(true);
        emailVerificationRepository.save(verification);

        // Generate verification token valid for 15 minutes
        String verificationToken = UUID.randomUUID().toString();
        redisTemplate.opsForValue().set(VERIFY_TOKEN_PREFIX + email, verificationToken, Duration.ofMinutes(15));

        Optional<User> existingUser = userRepository.findByEmail(email);
        boolean hasConflict = existingUser.isPresent();

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Email verified successfully");
        response.put("verificationToken", verificationToken);
        response.put("email", email);
        response.put("hasConflict", hasConflict);
        if (hasConflict) {
            response.put("existingProvider", existingUser.get().getProvider());
        }

        return response;
    }

    @Transactional
    public AuthResponse completeRegistration(String email, String name, String rawPassword,
                                             String verificationToken, String userAgent, String ipAddress) {
        log.info("Completing registration for: {}", email);

        // Verify token from Redis or fallback check
        String cachedToken = (String) redisTemplate.opsForValue().get(VERIFY_TOKEN_PREFIX + email);
        if (cachedToken == null || !cachedToken.equals(verificationToken)) {
            throw new BusinessException("Invalid or expired verification session. Please verify again.");
        }

        // Clean up verification token
        redisTemplate.delete(VERIFY_TOKEN_PREFIX + email);
        redisTemplate.delete(OTP_PREFIX + email);

        Optional<User> existingUserOpt = userRepository.findByEmail(email);
        User user;

        if (existingUserOpt.isPresent()) {
            // Account merge flow (e.g. existing Google user setting a password)
            user = existingUserOpt.get();
            user.setPassword(passwordEncoder.encode(rawPassword));
            user.setLinkedProviders(user.getLinkedProviders() + ",email");
            user.setAccountMerged(true);
            user.setLastLoginAt(LocalDateTime.now());
            user = userRepository.save(user);

            emailService.sendAccountMergeNotification(email, user.getName(), "email/password");
            userEventProducer.publishUserUpdated(user.getId(), user.getEmail(), user.getName(), user.getAvatarUrl(), "password,linkedProviders");
        } else {
            // New user registration
            String hashedPassword = passwordEncoder.encode(rawPassword);
            user = User.fromEmailRegistration(email, name, hashedPassword);
            user = userRepository.save(user);

            emailService.sendWelcomeEmail(email, user.getName());
            userEventProducer.publishUserCreated(user.getId(), user.getEmail(), user.getName(), "email", null);
        }

        // Generate tokens
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
}
