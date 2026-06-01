package com.smartestatehub.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration globale pour Spring AI.
 * Centralise la configuration des modèles de langage (NVIDIA NIM, OpenAI, etc.).
 */
@Configuration
public class AiConfig {

    /**
     * ChatClient est l'API fluide recommandée par Spring AI pour interagir avec les modèles de langage.
     * Il utilise le ChatModel auto-configuré via les propriétés définies dans application.yml.
     */
    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder.build();
    }
}
