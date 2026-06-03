package com.smartestatehub.auth.support;

import com.smartestatehub.config.JwtConfig;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AuthCookies {

    public static final String ACCESS_TOKEN = "access_token";
    public static final String REFRESH_TOKEN = "refresh_token";
    public static final String CSRF_TOKEN = "csrf_token";

    private final JwtConfig jwtConfig;

    @Value("${app.cookie.secure:false}")
    private boolean secure;

    public void setAccessToken(HttpServletResponse response, String token) {
        Duration maxAge = accessTokenMaxAge();
        response.addHeader(HttpHeaders.SET_COOKIE, buildHttpOnly(ACCESS_TOKEN, token, maxAge).toString());
    }

    public void setRefreshToken(HttpServletResponse response, String token, boolean rememberMe) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(REFRESH_TOKEN, token)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/");

        if (rememberMe) {
            builder.maxAge(Duration.ofMillis(jwtConfig.getRefreshExpiration()));
        }

        response.addHeader(HttpHeaders.SET_COOKIE, builder.build().toString());
    }

    public void setCsrfToken(HttpServletResponse response) {
        String token = UUID.randomUUID().toString();
        response.addHeader(HttpHeaders.SET_COOKIE, buildReadable(CSRF_TOKEN, token, accessTokenMaxAge()).toString());
    }

    public void clearAuthCookies(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, buildHttpOnly(ACCESS_TOKEN, "", Duration.ZERO).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildHttpOnly(REFRESH_TOKEN, "", Duration.ZERO).toString());
        response.addHeader(HttpHeaders.SET_COOKIE, buildReadable(CSRF_TOKEN, "", Duration.ZERO).toString());
    }

    public Optional<String> readCookie(HttpServletRequest request, String name) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return Optional.empty();
        }
        return Arrays.stream(cookies)
                .filter(c -> name.equals(c.getName()))
                .map(Cookie::getValue)
                .filter(v -> !v.isBlank())
                .findFirst();
    }

    private Duration accessTokenMaxAge() {
        return Duration.ofMillis(jwtConfig.getExpiration());
    }

    private ResponseCookie buildHttpOnly(String name, String value, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }

    private ResponseCookie buildReadable(String name, String value, Duration maxAge) {
        return ResponseCookie.from(name, value)
                .httpOnly(false)
                .secure(secure)
                .sameSite("Lax")
                .path("/")
                .maxAge(maxAge)
                .build();
    }
}

