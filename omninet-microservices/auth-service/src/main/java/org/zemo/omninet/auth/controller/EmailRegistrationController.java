package org.zemo.omninet.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.zemo.omninet.auth.dto.*;
import org.zemo.omninet.auth.service.EmailRegistrationService;
import org.zemo.omninet.auth.service.UserService;
import org.zemo.omninet.common.dto.ApiResponse;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/auth/register", "/api/auth/register"})
@RequiredArgsConstructor
@Slf4j
public class EmailRegistrationController {

    private final EmailRegistrationService emailRegistrationService;
    private final UserService userService;

    @PostMapping("/initiate")
    public ResponseEntity<ApiResponse<Map<String, Object>>> initiateRegistration(
            @Valid @RequestBody EmailRegistrationRequest request) {

        Map<String, Object> response = emailRegistrationService.initiateEmailRegistration(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(response, "Verification code sent"));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyOtp(
            @Valid @RequestBody OtpVerificationRequest request) {

        Map<String, Object> response = emailRegistrationService.verifyOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.success(response, "OTP verified successfully"));
    }

    @PostMapping("/complete")
    public ResponseEntity<ApiResponse<AuthResponse>> completeRegistration(
            @Valid @RequestBody CompleteRegistrationRequest request,
            HttpServletRequest httpRequest) {

        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        AuthResponse authResponse = emailRegistrationService.completeRegistration(
                request.getEmail(),
                request.getName(),
                request.getPassword(),
                request.getVerificationToken(),
                userAgent,
                ipAddress
        );

        return ResponseEntity.ok(ApiResponse.success(authResponse, "Registration completed successfully"));
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendOtp(
            @Valid @RequestBody EmailRegistrationRequest request) {

        Map<String, Object> response = emailRegistrationService.initiateEmailRegistration(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(response, "Verification code resent"));
    }

    @GetMapping("/check-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkEmailAvailability(
            @RequestParam String email) {

        boolean exists = userService.findByEmail(email).isPresent();
        Map<String, Object> result = Map.of(
                "available", !exists,
                "email", email,
                "message", exists ? "Email is already registered" : "Email is available"
        );
        return ResponseEntity.ok(ApiResponse.success(result, "Email checked"));
    }
}
