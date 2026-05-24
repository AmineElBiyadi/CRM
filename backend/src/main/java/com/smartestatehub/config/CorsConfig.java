package com.smartestatehub.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Origines autorisées (frontend en développement)
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5175",
            "http://localhost:5173",
            "http://localhost:3000"
        ));

        // Méthodes HTTP autorisées
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));

        // En-têtes autorisés (incluant X-Agent-Id pour les tests en dev)
        configuration.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type",
            "X-Agent-Id",
            "Accept",
            "Origin"
        ));

        // Autoriser l'envoi des cookies / credentials
        configuration.setAllowCredentials(true);

        // Durée de mise en cache du preflight (en secondes)
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
