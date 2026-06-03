package com.smartestatehub.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartestatehub.auth.filter.CsrfFilter;
import com.smartestatehub.auth.filter.JwtAuthenticationFilter;
import com.smartestatehub.shared.dto.ApiErrorResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CsrfFilter csrfFilter;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final CorsConfigurationSource corsConfigurationSource;
    private final ObjectMapper objectMapper;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .anonymous(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint((request, response, authException) -> {
                    writeError(response, 401, ApiErrorResponse.of(
                            "UNAUTHORIZED",
                            "Session expirée ou non connecté.",
                            "Connectez-vous pour accéder à cette ressource."
                    ));
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    writeError(response, 403, ApiErrorResponse.of(
                            "FORBIDDEN",
                            "Accès refusé.",
                            "Cette section est réservée aux administrateurs. Utilisez un compte admin ou demandez les droits à votre responsable."
                    ));
                })
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/api/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/notifications/**").hasAnyRole("AGENT", "ADMIN")
                .requestMatchers(
                    "/api/agent/**",
                    "/api/agents/**",
                    "/api/crm/**",
                    "/api/documents/**",
                    "/api/properties/**",
                    "/api/property-types/**",
                    "/api/contracts/**",
                    "/api/offers/**",
                    "/api/dossiers/**",
                    "/api/deals/**",
                    "/api/clients/**",
                    "/api/meetings/**",
                    "/api/interactions/**",
                    "/api/pipeline/**",
                    "/api/dashboard/**",
                    "/api/ai/**"
                ).hasAnyRole("AGENT", "ADMIN")
                .requestMatchers("/api/public/client-portal/**").permitAll()
                .requestMatchers("/api/client/**").hasAnyRole("CLIENT", "AGENT", "ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(csrfFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    private void writeError(
            jakarta.servlet.http.HttpServletResponse response,
            int status,
            ApiErrorResponse body
    ) throws java.io.IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}
