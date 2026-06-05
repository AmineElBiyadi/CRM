package com.smartestatehub.auth.filter;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.model.Client;
import com.smartestatehub.crm.repository.ClientRepository;
import com.smartestatehub.auth.model.Role;
import com.smartestatehub.auth.support.AuthCookies;
import com.smartestatehub.shared.util.JwtUtil;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AuthCookies authCookies;
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String token = resolveToken(request);
        String path = request.getRequestURI();

        if (token != null) {
            boolean valid = jwtUtil.isTokenValid(token);
            if (valid) {
                String email = jwtUtil.extractEmail(token);
                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    // Try InternalUser first
                    userRepository.findByEmail(email)
                            .filter(user -> user.getDeletedAt() == null)
                            .ifPresentOrElse(
                                user -> setAuthentication(email, user.getRole().name()),
                                () -> clientRepository.findByEmail(email)
                                    .filter(client -> client.getDeletedAt() == null)
                                    .ifPresent(client -> setAuthentication(email, Role.CLIENT.name()))
                            );
                    
                    if (SecurityContextHolder.getContext().getAuthentication() == null) {
                        System.out.println("DEBUG JWT: User/Client not found in DB for email: " + email);
                    }
                }
            } else {
                System.out.println("DEBUG JWT: Token found but INVALID for path: " + path);
            }
        } else {
            if (!path.startsWith("/api/public/") && !path.startsWith("/api/auth/")) {
                System.out.println("DEBUG JWT: No token found for path: " + path);
            }
        }

        filterChain.doFilter(request, response);
    }

    private void setAuthentication(String email, String roleName) {
        String authority = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        var auth = new UsernamePasswordAuthenticationToken(
                email,
                null,
                List.of(new SimpleGrantedAuthority(authority))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private String resolveToken(HttpServletRequest request) {
        // Prioritize Authorization header (explicitly sent by frontend)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return authHeader.substring(7);
        }
        
        // Fallback to cookie
        return authCookies.readCookie(request, AuthCookies.ACCESS_TOKEN)
                .orElse(null);
    }
}
