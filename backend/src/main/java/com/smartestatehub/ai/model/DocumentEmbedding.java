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
     * Utilisation de double[] pour stocker les vecteurs.
     * columnDefinition="vector(1536)" permet à Hibernate de créer le bon type dans PostgreSQL.
     */
    @Column(name = "embedding", columnDefinition = "vector(1536)")
    private double[] embedding;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_document", nullable = false)
    private Document document;
}
