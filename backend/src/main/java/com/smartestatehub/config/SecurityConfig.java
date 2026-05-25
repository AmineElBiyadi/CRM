package com.smartestatehub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(CorsConfigurationSource corsConfigurationSource) {
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Désactiver CSRF (inutile pour une API REST stateless)
                .csrf(AbstractHttpConfigurer::disable)

                // Appliquer la config CORS définie dans CorsConfig
                .cors(cors -> cors.configurationSource(corsConfigurationSource))

                // Mode STATELESS : pas de session HTTP, pas de redirection vers /login
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // Désactiver la page de login par défaut de Spring Security
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)

                // Règles d'autorisation
                .authorizeHttpRequests(auth -> auth
                        // Endpoints publics d'authentification
                        .requestMatchers("/api/auth/**").permitAll()

                        // Endpoints du dashboard agent : autorisés sans JWT en dev (via X-Agent-Id)
                        .requestMatchers("/api/agent/**").permitAll()

                        // Actuator (supervision)
                        .requestMatchers("/actuator/**").permitAll()

                        .requestMatchers("/api/properties/**").permitAll()

                        .requestMatchers("/api/contracts/**").permitAll()

                        // Toutes les autres routes nécessitent une authentification
                        // (le filtre JWT sera branché ici quand il sera implémenté)
                        .anyRequest().authenticated());

        // TODO: Brancher le JwtAuthenticationFilter ici quand TokenService sera
        // implémenté
        // http.addFilterBefore(jwtAuthenticationFilter,
        // UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
