package org.zemo.omninet.auth.controller;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.zemo.omninet.auth.config.CustomUserDetails;
import org.zemo.omninet.auth.dto.*;
import org.zemo.omninet.auth.model.User;
import org.zemo.omninet.auth.service.AuthenticationService;
import org.zemo.omninet.auth.service.UserService;
import org.zemo.omninet.common.dto.ApiResponse;

import java.util.Map;

@RestController
@RequestMapping({"/api/v1/auth", "/api/auth"})
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthenticationService authenticationService;
    private final UserService userService;

    @PostMapping("/login/email")
    public ResponseEntity<ApiResponse<AuthResponse>> loginWithEmail(
            @Valid @RequestBody EmailLoginRequest request,
            HttpServletRequest httpRequest) {

        String userAgent = httpRequest.getHeader("User-Agent");
        String ipAddress = httpRequest.getRemoteAddr();

        AuthResponse authResponse = authenticationService.authenticateUser(
                request.getEmail(),
                request.getPassword(),
                userAgent,
                ipAddress
        );

        return ResponseEntity.ok(ApiResponse.success(authResponse, "Authentication successful"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {

        AuthResponse authResponse = authenticationService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success(authResponse, "Token refreshed successfully"));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody(required = false) Map<String, String> request) {

        String refreshToken = request != null ? request.get("refreshToken") : null;
        authenticationService.logout(refreshToken);
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out successfully"));
    }

    @PostMapping("/logout-all")
    public ResponseEntity<ApiResponse<Void>> logoutAll(
            @AuthenticationPrincipal CustomUserDetails userDetails) {

        if (userDetails != null && userDetails.getUser() != null) {
            authenticationService.logoutAll(userDetails.getUser().getId());
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out from all sessions"));
    }

    @GetMapping("/check-methods")
    public ResponseEntity<ApiResponse<CheckMethodsResponse>> checkMethods(
            @RequestParam String email) {

        CheckMethodsResponse response = authenticationService.checkAuthenticationMethods(email);
        return ResponseEntity.ok(ApiResponse.success(response, "Authentication methods retrieved"));
    }

    @PostMapping("/add-password")
    public ResponseEntity<ApiResponse<Void>> addPassword(
            @Valid @RequestBody AddPasswordRequest request) {

        authenticationService.addPasswordToOAuthAccount(request.getEmail(), request.getPassword());
        return ResponseEntity.ok(ApiResponse.success(null, "Password added successfully"));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {

        if (userDetails == null || userDetails.getUser() == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }

        authenticationService.changePassword(
                userDetails.getUser().getEmail(),
                request.getCurrentPassword(),
                request.getNewPassword()
        );
        return ResponseEntity.ok(ApiResponse.success(null, "Password changed successfully"));
    }

    @GetMapping("/user")
    public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            HttpServletRequest request) {

        String userId = userDetails != null && userDetails.getUser() != null
                ? userDetails.getUser().getId()
                : org.zemo.omninet.common.security.GatewayHeaders.getUserId(request);

        String userEmail = userDetails != null && userDetails.getUser() != null
                ? userDetails.getUser().getEmail()
                : org.zemo.omninet.common.security.GatewayHeaders.getUserEmail(request);

        User user = null;
        if (userId != null && !userId.isBlank()) {
            try {
                user = userService.getUserById(userId);
            } catch (Exception ignored) {}
        }
        if (user == null && userEmail != null && !userEmail.isBlank()) {
            try {
                user = userService.getUserByEmail(userEmail);
            } catch (Exception ignored) {}
        }

        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("User not authenticated"));
        }

        return ResponseEntity.ok(ApiResponse.success(UserDto.fromEntity(user), "Current user retrieved"));
    }
}
