package com.smartestatehub.config;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.ChatOptions;
import org.springframework.ai.embedding.Embedding;
import org.springframework.ai.embedding.EmbeddingModel;
import org.springframework.ai.embedding.EmbeddingRequest;
import org.springframework.ai.embedding.EmbeddingResponse;
import org.springframework.ai.document.Document;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.Collections;
import java.util.List;

@Configuration
public class OpenAiConfig {

    private static final String PLACEHOLDER_KEY = "votre_cle_openai_ici";

    private static final String MOCK_AI_CONDITION =
            "!T(org.springframework.util.StringUtils).hasText('${spring.ai.openai.api-key:}') "
                    + "|| '${spring.ai.openai.api-key:}'.equals('" + PLACEHOLDER_KEY + "')";

    @Bean
    @Primary
    @ConditionalOnExpression(MOCK_AI_CONDITION)
    public EmbeddingModel embeddingModel() {
        return new EmbeddingModel() {
            @Override
            public List<Double> embed(String text) {
                return Collections.nCopies(1536, 0.0);
            }

            @Override
            public List<Double> embed(Document document) {
                return Collections.nCopies(1536, 0.0);
            }

            @Override
            public EmbeddingResponse call(EmbeddingRequest request) {
                List<Embedding> embeddings = request.getInstructions().stream()
                        .map(text -> new Embedding(Collections.nCopies(1536, 0.0), 0))
                        .toList();
                return new EmbeddingResponse(embeddings);
            }
        };
    }

    @Bean
    @Primary
    @ConditionalOnExpression(MOCK_AI_CONDITION)
    public ChatModel chatModel() {
        return new ChatModel() {
            @Override
            public ChatResponse call(Prompt prompt) {
                return new ChatResponse(Collections.emptyList());
            }

            @Override
            public ChatOptions getDefaultOptions() {
                return null;
            }
        };
    }
}
