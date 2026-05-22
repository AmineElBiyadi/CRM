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
     * Stored as text representation of the pgvector type.
     * The actual vector column is managed by the pgvector extension.
     */
    @Column(name = "embedding", columnDefinition = "TEXT")
    private String embedding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_document", nullable = false)
    private Document document;
}
