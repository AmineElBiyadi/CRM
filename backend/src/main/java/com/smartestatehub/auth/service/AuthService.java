package com.smartestatehub.auth.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.smartestatehub.auth.dto.LoginRequest;
import com.smartestatehub.auth.dto.UserInfoResponse;
import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.model.PasswordResetToken;
import com.smartestatehub.auth.model.RefreshToken;
import com.smartestatehub.auth.repository.PasswordResetTokenRepository;
import com.smartestatehub.auth.repository.RefreshTokenRepository;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.auth.support.AuthCookies;
import com.smartestatehub.auth.support.TokenHasher;
import com.smartestatehub.config.JwtConfig;
import com.smartestatehub.auth.model.Role;
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.repository.ClientRepository;
import com.smartestatehub.notification.service.EmailService;
import com.smartestatehub.shared.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.security.GeneralSecurityException;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JwtConfig jwtConfig;
    private final TokenHasher tokenHasher;
    private final AuthCookies authCookies;
    private final EmailService emailService;

    @Value("${app.google.client-id}")
    private String googleClientId;

    @Transactional
    public UserInfoResponse login(LoginRequest request, HttpServletResponse response) {
        InternalUser user = authenticate(request.getEmail(), request.getPassword());
        boolean rememberMe = Boolean.TRUE.equals(request.getRememberMe());

        refreshTokenRepository.revokeAllForUser(user.getIdUser());
        String token = issueSession(user, rememberMe, response);

        return toUserInfo(user, token);
    }

    @Transactional
    public UserInfoResponse loginClient(LoginRequest request, HttpServletResponse response) {
        Client client = authenticateClient(request.getEmail(), request.getPassword());
        boolean rememberMe = Boolean.TRUE.equals(request.getRememberMe());

        refreshTokenRepository.revokeAllForClient(client.getIdClient());
        String token = issueClientSession(client, rememberMe, response);

        return toUserInfo(client, token);
    }

    @Transactional
    public UserInfoResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        String rawRefresh = authCookies.readCookie(request, AuthCookies.REFRESH_TOKEN)
                .orElseThrow(() -> new BadCredentialsException("Session expirée."));

        String hash = tokenHasher.hash(rawRefresh);
        RefreshToken stored = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash)
                .orElseThrow(() -> new BadCredentialsException("Session expirée."));

        if (stored.getExpiresAt().isBefore(LocalDateTime.now())) {
            revoke(stored);
            throw new BadCredentialsException("Session expirée.");
        }

        boolean rememberMe = stored.isRememberMe();
        revoke(stored);

        if (stored.getInternalUser() != null) {
            InternalUser user = stored.getInternalUser();
            if (user.getDeletedAt() != null) {
                throw new BadCredentialsException("Ce compte a été désactivé.");
            }
            String token = issueSession(user, rememberMe, response);
            return toUserInfo(user, token);
        } else if (stored.getClient() != null) {
            Client client = stored.getClient();
            if (client.getDeletedAt() != null) {
                throw new BadCredentialsException("Ce compte a été désactivé.");
            }
            String token = issueClientSession(client, rememberMe, response);
            return toUserInfo(client, token);
        }

        throw new BadCredentialsException("Session invalide.");
    }

    @Transactional
    public UserInfoResponse loginWithGoogle(String idToken, String portal, HttpServletResponse response) {
        GoogleIdToken.Payload payload = verifyGoogleToken(idToken);
        String email = payload.getEmail();
        String googleId = payload.getSubject();

        log.info("[AUTH] Attempting Google login for email: {}, googleId: {}, portal: {}", email, googleId, portal);

        if ("ADMIN_AGENT".equals(portal)) {
            InternalUser user = userRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        log.warn("[AUTH] No user found for Google email: {}", email);
                        return new BadCredentialsException("Aucun compte associé à cet email Google.");
                    });
            
            if (user.getDeletedAt() != null) {
                log.warn("[AUTH] User {} is deleted, login aborted.", email);
                throw new BadCredentialsException("Ce compte est désactivé.");
            }

            // Check if account is linked
            log.info("[AUTH] User {} found. Database googleId: {}, Incoming googleId: {}", 
                    email, user.getGoogleId(), googleId);

            if (user.getGoogleId() == null || !user.getGoogleId().equals(googleId)) {
                log.warn("[AUTH] Google ID mismatch for user {}. DB: {}, Token: {}", 
                        email, user.getGoogleId(), googleId);
                throw new BadCredentialsException("Ce compte n'est pas encore lié à Google. Veuillez le lier depuis votre profil.");
            }

            refreshTokenRepository.revokeAllForUser(user.getIdUser());
            String token = issueSession(user, true, response);
            log.info("[AUTH] Google login successful for user: {}", email);
            return toUserInfo(user, token);
        } else if ("CLIENT".equals(portal)) {
            Client client = clientRepository.findByEmail(email)
                    .orElseThrow(() -> {
                        log.warn("[AUTH] No client found for Google email: {}", email);
                        return new BadCredentialsException("Aucun compte client associé à cet email Google.");
                    });

            if (client.getDeletedAt() != null) {
                log.warn("[AUTH] Client {} is deleted, login aborted.", email);
                throw new BadCredentialsException("Votre compte est inactif.");
            }

            // Check if account is linked
            log.info("[AUTH] Client {} found. Database googleId: {}, Incoming googleId: {}", 
                    email, client.getGoogleId(), googleId);

            if (client.getGoogleId() == null || !client.getGoogleId().equals(googleId)) {
                log.warn("[AUTH] Google ID mismatch for client {}. DB: {}, Token: {}", 
                        email, client.getGoogleId(), googleId);
                throw new BadCredentialsException("Votre compte n'est pas encore lié à Google. Veuillez le lier depuis votre espace client.");
            }

            refreshTokenRepository.revokeAllForClient(client.getIdClient());
            String token = issueClientSession(client, true, response);
            log.info("[AUTH] Google login successful for client: {}", email);
            return toUserInfo(client, token);
        }

        throw new BadCredentialsException("Type de portail invalide.");
    }

    @Transactional
    public void linkGoogleAccount(String email, String idToken, String role) {
        GoogleIdToken.Payload payload = verifyGoogleToken(idToken);
        String googleEmail = payload.getEmail();
        String googleId = payload.getSubject();

        log.info("[AUTH] Linking Google account for email: {}. Role: {}, Google Email: {}, Google ID: {}", 
                email, role, googleEmail, googleId);

        if (!email.equalsIgnoreCase(googleEmail)) {
            log.warn("[AUTH] Email mismatch during linking. Account: {}, Google: {}", email, googleEmail);
            throw new BadCredentialsException("L'email Google (" + googleEmail + ") ne correspond pas à l'email de votre compte (" + email + ").");
        }

        // Use role to decide which table to update
        if ("ROLE_CLIENT".equals(role)) {
            Client client = clientRepository.findByEmail(email)
                    .orElseThrow(() -> new BadCredentialsException("Client introuvable."));
            client.setGoogleId(googleId);
            clientRepository.save(client);
            log.info("[AUTH] Google account linked for Client: {}", email);
        } else {
            InternalUser user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new BadCredentialsException("Utilisateur interne introuvable."));
            user.setGoogleId(googleId);
            userRepository.save(user);
            log.info("[AUTH] Google account linked for InternalUser: {}", email);
        }
    }

    private GoogleIdToken.Payload verifyGoogleToken(String idToken) {
        try {
            if (googleClientId == null || googleClientId.isBlank()) {
                log.error("[AUTH] googleClientId is not configured!");
                throw new BadCredentialsException("Configuration Google manquante sur le serveur.");
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            log.info("[AUTH] Verifying Google token with client ID: {}", googleClientId);
            GoogleIdToken token = verifier.verify(idToken);
            if (token != null) {
                return token.getPayload();
            } else {
                log.warn("[AUTH] Google token verification returned null for token: {}", 
                        idToken.substring(0, Math.min(idToken.length(), 20)) + "...");
                throw new BadCredentialsException("Jeton Google invalide ou expiré.");
            }
        } catch (GeneralSecurityException | IOException e) {
            log.error("[AUTH] Security/IO error during Google token verification: {}", e.getMessage());
            throw new BadCredentialsException("Erreur lors de la vérification du jeton Google.");
        } catch (Exception e) {
            log.error("[AUTH] Unexpected error during Google token verification", e);
            throw e;
        }
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        authCookies.readCookie(request, AuthCookies.REFRESH_TOKEN).ifPresent(raw -> {
            String hash = tokenHasher.hash(raw);
            refreshTokenRepository.findByTokenHashAndRevokedFalse(hash).ifPresent(this::revoke);
        });
        authCookies.clearAuthCookies(response);
    }

    public UserInfoResponse me(String email) {
        return userRepository.findByEmail(email)
                .filter(u -> u.getDeletedAt() == null)
                .map(u -> this.toUserInfo(u, null))
                .or(() -> clientRepository.findByEmail(email)
                        .filter(c -> c.getDeletedAt() == null)
                        .map(c -> this.toUserInfo(c, null)))
                .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable."));
    }

    @Transactional
    public void changePassword(String email, String oldPassword, String newPassword) {
        InternalUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable."));

        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            throw new BadCredentialsException("L'ancien mot de passe est incorrect.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    @Transactional
    public void forgotPassword(String email, String portal) {
        Optional<InternalUser> userOpt = userRepository.findByEmail(email);
        Optional<Client> clientOpt = clientRepository.findByEmail(email);

        boolean isAgentAdminPortal = "ADMIN_AGENT".equals(portal);
        boolean isClientPortal = "CLIENT".equals(portal);

        PasswordResetToken token = null;

        if (isAgentAdminPortal) {
            if (userOpt.isEmpty()) {
                throw new BadCredentialsException("Aucun compte agent ou administrateur n'est associé à cet email.");
            }
            InternalUser user = userOpt.get();
            if (user.getDeletedAt() != null) {
                throw new BadCredentialsException("Ce compte est désactivé. Veuillez contacter votre administrateur.");
            }
            token = PasswordResetToken.builder()
                    .internalUser(user)
                    .tokenHash(tokenHasher.hash(tokenHasher.generateOpaqueToken()))
                    .expiresAt(LocalDateTime.now().plusHours(2))
                    .used(false)
                    .build();
        } else if (isClientPortal) {
            if (clientOpt.isEmpty()) {
                throw new BadCredentialsException("Aucun compte client n'est associé à cet email.");
            }
            Client client = clientOpt.get();
            if (client.getDeletedAt() != null) {
                throw new BadCredentialsException("Votre compte est inactif. Veuillez contacter l'agence.");
            }
            token = PasswordResetToken.builder()
                    .client(client)
                    .tokenHash(tokenHasher.hash(tokenHasher.generateOpaqueToken()))
                    .expiresAt(LocalDateTime.now().plusHours(2))
                    .used(false)
                    .build();
        }

        if (token == null) {
            throw new BadCredentialsException("Type de portail invalide.");
        }

        String rawToken = tokenHasher.generateOpaqueToken();
        token.setTokenHash(tokenHasher.hash(rawToken));
        
        passwordResetTokenRepository.save(token);
        emailService.sendPasswordResetEmail(email, rawToken, portal);
    }

    @Transactional
    public void resetPassword(String rawToken, String newPassword) {
        String hash = tokenHasher.hash(rawToken);
        PasswordResetToken token = passwordResetTokenRepository.findByTokenHashAndUsedFalse(hash)
                .orElseThrow(() -> new BadCredentialsException("Le lien de réinitialisation est invalide ou a déjà été utilisé."));

        if (token.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new BadCredentialsException("Le lien de réinitialisation a expiré.");
        }

        String encodedPassword = passwordEncoder.encode(newPassword);
        if (token.getInternalUser() != null) {
            InternalUser user = token.getInternalUser();
            user.setPassword(encodedPassword);
            userRepository.save(user);
        } else if (token.getClient() != null) {
            Client client = token.getClient();
            client.setPassword(encodedPassword);
            clientRepository.save(client);
        }

        token.setUsed(true);
        token.setUsedAt(LocalDateTime.now());
        passwordResetTokenRepository.save(token);
    }

    private InternalUser authenticate(String email, String password) {
        InternalUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect."));

        if (user.getDeletedAt() != null) {
            throw new BadCredentialsException("Ce compte a été désactivé.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new BadCredentialsException("Email ou mot de passe incorrect.");
        }

        return user;
    }

    private Client authenticateClient(String email, String password) {
        Client client = clientRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Email ou mot de passe incorrect."));

        if (client.getDeletedAt() != null) {
            throw new BadCredentialsException("Ce compte a été désactivé.");
        }

        if (!passwordEncoder.matches(password, client.getPassword())) {
            throw new BadCredentialsException("Email ou mot de passe incorrect.");
        }

        return client;
    }

    private String issueSession(InternalUser user, boolean rememberMe, HttpServletResponse response) {
        return issueGenericSession(user.getEmail(), user.getRole().name(), user, null, rememberMe, response);
    }

    private String issueClientSession(Client client, boolean rememberMe, HttpServletResponse response) {
        return issueGenericSession(client.getEmail(), Role.CLIENT.name(), null, client, rememberMe, response);
    }

    private String issueGenericSession(String email, String role, InternalUser user, Client client, boolean rememberMe, HttpServletResponse response) {
        String accessToken = jwtUtil.generateToken(email, role);

        String rawRefresh = tokenHasher.generateOpaqueToken();
        long refreshSeconds = rememberMe
                ? jwtConfig.getRefreshExpiration() / 1000
                : 8 * 3600L;

        RefreshToken refreshToken = RefreshToken.builder()
                .internalUser(user)
                .client(client)
                .tokenHash(tokenHasher.hash(rawRefresh))
                .expiresAt(LocalDateTime.now().plusSeconds(refreshSeconds))
                .rememberMe(rememberMe)
                .revoked(false)
                .build();
        refreshTokenRepository.save((RefreshToken) refreshToken);

        authCookies.setAccessToken(response, accessToken);
        authCookies.setRefreshToken(response, rawRefresh, rememberMe);
        authCookies.setCsrfToken(response);

        return accessToken;
    }

    private void revoke(RefreshToken token) {
        token.setRevoked(true);
        token.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(token);
    }

    private UserInfoResponse toUserInfo(InternalUser user, String token) {
        return UserInfoResponse.builder()
                .role(user.getRole().name())
                .userId(user.getIdUser())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .token(token)
                .googleLinked(user.getGoogleId() != null)
                .build();
    }

    private UserInfoResponse toUserInfo(Client client, String token) {
        return UserInfoResponse.builder()
                .role(Role.CLIENT.name())
                .userId(client.getIdClient())
                .firstName(client.getFirstName())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .token(token)
                .googleLinked(client.getGoogleId() != null)
                .build();
    }
}
