package com.smartestatehub.auth.service;

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
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.repository.ClientRepository;
import com.smartestatehub.notification.service.EmailService;
import com.smartestatehub.shared.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
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

    @Transactional
    public UserInfoResponse login(LoginRequest request, HttpServletResponse response) {
        InternalUser user = authenticate(request.getEmail(), request.getPassword());
        boolean rememberMe = Boolean.TRUE.equals(request.getRememberMe());

        refreshTokenRepository.revokeAllForUser(user.getIdUser());
        issueSession(user, rememberMe, response);

        return toUserInfo(user);
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

        InternalUser user = stored.getInternalUser();
        if (user.getDeletedAt() != null) {
            revoke(stored);
            throw new BadCredentialsException("Ce compte a été désactivé.");
        }

        boolean rememberMe = stored.isRememberMe();
        revoke(stored);

        issueSession(user, rememberMe, response);
        return toUserInfo(user);
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
        InternalUser user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadCredentialsException("Utilisateur introuvable."));
        if (user.getDeletedAt() != null) {
            throw new BadCredentialsException("Ce compte a été désactivé.");
        }
        return toUserInfo(user);
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

    private void issueSession(InternalUser user, boolean rememberMe, HttpServletResponse response) {
        String role = user.getRole().name();
        String accessToken = jwtUtil.generateToken(user.getEmail(), role);

        String rawRefresh = tokenHasher.generateOpaqueToken();
        long refreshSeconds = rememberMe
                ? jwtConfig.getRefreshExpiration() / 1000
                : 8 * 3600L;

        RefreshToken refreshToken = RefreshToken.builder()
                .internalUser(user)
                .tokenHash(tokenHasher.hash(rawRefresh))
                .expiresAt(LocalDateTime.now().plusSeconds(refreshSeconds))
                .rememberMe(rememberMe)
                .revoked(false)
                .build();
        refreshTokenRepository.save(refreshToken);

        authCookies.setAccessToken(response, accessToken);
        authCookies.setRefreshToken(response, rawRefresh, rememberMe);
        authCookies.setCsrfToken(response);
    }

    private void revoke(RefreshToken token) {
        token.setRevoked(true);
        token.setRevokedAt(LocalDateTime.now());
        refreshTokenRepository.save(token);
    }

    private UserInfoResponse toUserInfo(InternalUser user) {
        return UserInfoResponse.builder()
                .role(user.getRole().name())
                .userId(user.getIdUser())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .email(user.getEmail())
                .build();
    }
}
