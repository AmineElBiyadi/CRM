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
import com.smartestatehub.auth.model.Role;
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.repository.ClientRepository;
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
        refreshTokenRepository.save(refreshToken);

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
                .build();
    }
}
