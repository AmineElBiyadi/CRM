package com.smartestatehub.auth.controller;

import com.smartestatehub.auth.dto.ForgotPasswordRequest;
import com.smartestatehub.auth.dto.GoogleLoginRequest;
import com.smartestatehub.auth.dto.LoginRequest;
import com.smartestatehub.auth.dto.ResetPasswordRequest;
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
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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

    @PostMapping("/login-client")
    public ResponseEntity<?> loginClient(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        try {
            UserInfoResponse user = authService.loginClient(request, response);
            return ResponseEntity.ok(user);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(authError(e.getMessage()));
        }
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(
            @Valid @RequestBody GoogleLoginRequest request,
            HttpServletResponse response) {
        try {
            UserInfoResponse user = authService.loginWithGoogle(request.getIdToken(), request.getPortal(), response);
            return ResponseEntity.ok(user);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(401).body(authError(e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace to the console
            return ResponseEntity.status(500).body(authError("Erreur interne du serveur : " + e.getMessage()));
        }
    }

    @PostMapping("/link-google")
    public ResponseEntity<?> linkGoogle(
            @AuthenticationPrincipal String email,
            @RequestBody Map<String, String> body,
            HttpServletRequest request) {
        if (email == null) {
            return ResponseEntity.status(401).body(authError("Non authentifié."));
        }
        String idToken = body.get("idToken");
        if (idToken == null) {
            return ResponseEntity.status(400).body(authError("Le jeton Google est requis."));
        }
        
        // Check current role to determine which table to update
        String role = SecurityContextHolder.getContext().getAuthentication().getAuthorities().iterator().next().getAuthority();
        
        try {
            authService.linkGoogleAccount(email, idToken, role);
            return ResponseEntity.ok(Map.of("message", "Compte Google lié avec succès."));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(400).body(authError(e.getMessage()));
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
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            authService.forgotPassword(request.getEmail(), request.getPortal());
            return ResponseEntity.ok(Map.of("message", "Un lien de réinitialisation vous a été envoyé."));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            authService.resetPassword(request.getToken(), request.getNewPassword());
            return ResponseEntity.ok(Map.of("message", "Votre mot de passe a été réinitialisé avec succès."));
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
    }

    private static ApiErrorResponse authError(String message) {
        return ApiErrorResponse.of("UNAUTHORIZED", message, null);
    }
}
