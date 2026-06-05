package com.smartestatehub.auth.filter;

import com.smartestatehub.auth.support.AuthCookies;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class CsrfFilter extends OncePerRequestFilter {

    public static final String CSRF_HEADER = "X-CSRF-Token";

    private static final Set<String> EXEMPT_PATHS = Set.of(
            "/api/auth/login",
            "/api/auth/login-client",
            "/api/auth/google",
            "/api/auth/link-google",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/api/rag/chat",
            "/api/auth/forgot-password",
            "/api/auth/reset-password"
    );

    private final AuthCookies authCookies;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!isMutating(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String path = request.getRequestURI();
        if (EXEMPT_PATHS.contains(path) || path.startsWith("/api/webhooks/")) {
            filterChain.doFilter(request, response);
            return;
        }

        String cookieToken = authCookies.readCookie(request, AuthCookies.CSRF_TOKEN).orElse(null);
        String headerToken = request.getHeader(CSRF_HEADER);

        if (cookieToken == null || headerToken == null || !cookieToken.equals(headerToken)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("{\"message\":\"CSRF token invalide ou manquant.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private boolean isMutating(String method) {
        return "POST".equalsIgnoreCase(method)
                || "PUT".equalsIgnoreCase(method)
                || "DELETE".equalsIgnoreCase(method)
                || "PATCH".equalsIgnoreCase(method);
    }
}
