package com.smartestatehub.auth.service;

import com.smartestatehub.auth.dto.LoginRequest;
import com.smartestatehub.auth.dto.UserInfoResponse;
import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.model.RefreshToken;
import com.smartestatehub.auth.repository.RefreshTokenRepository;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.auth.support.AuthCookies;
import com.smartestatehub.auth.support.TokenHasher;
import com.smartestatehub.config.JwtConfig;
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
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final JwtConfig jwtConfig;
    private final TokenHasher tokenHasher;
    private final AuthCookies authCookies;

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
