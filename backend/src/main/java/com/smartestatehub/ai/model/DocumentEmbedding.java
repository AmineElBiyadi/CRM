package com.smartestatehub.ai.model;

import com.smartestatehub.crm.model.Document;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "document_embeddings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentEmbedding {

    @Id
    @Column(name = "id", nullable = false)
    private String id;

    @Column(name = "chunk_index")
    private Integer chunkIndex;

    @Column(name = "chunk_text", columnDefinition = "TEXT")
    private String chunkText;

    /**
     * Géré par pgvector (dimension 1536 pour OpenAI).
     */
    @Column(name = "embedding", columnDefinition = "vector(1536)")
    private String embedding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_document", nullable = false)
    private Document document;
}
