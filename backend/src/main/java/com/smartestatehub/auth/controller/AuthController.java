package com.smartestatehub.auth.controller;

import com.smartestatehub.auth.dto.LoginRequest;
import com.smartestatehub.auth.dto.UserInfoResponse;
import com.smartestatehub.auth.service.AuthService;
import com.smartestatehub.auth.support.AuthCookies;
import com.smartestatehub.crm.dto.ChangePasswordDto;
import com.smartestatehub.shared.dto.ApiErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthCookies authCookies;

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        try {
            UserInfoResponse user = authService.login(request, response);
            return ResponseEntity.ok(user);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(authError(e.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(HttpServletRequest request, HttpServletResponse response) {
        try {
            UserInfoResponse user = authService.refresh(request, response);
            return ResponseEntity.ok(user);
        } catch (BadCredentialsException e) {
            authCookies.clearAuthCookies(response);
            return ResponseEntity.status(401).body(authError(e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal String email) {
        if (email == null) {
            return ResponseEntity.status(401).body(ApiErrorResponse.of(
                    "UNAUTHORIZED",
                    "Non authentifié.",
                    "Connectez-vous pour accéder à votre espace."
            ));
        }
        try {
            return ResponseEntity.ok(authService.me(email));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(authError(e.getMessage()));
        }
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(
            @AuthenticationPrincipal String email,
            @Valid @RequestBody ChangePasswordDto request) {
        if (email == null) {
            return ResponseEntity.status(401).body(authError("Non authentifié."));
        }
        try {
            authService.changePassword(email, request.getOldPassword(), request.getNewPassword());
            return ResponseEntity.ok().build();
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(400).body(java.util.Map.of("message", e.getMessage()));
        }
    }

    private static ApiErrorResponse authError(String message) {
        return ApiErrorResponse.of("UNAUTHORIZED", message, null);
    }
}
