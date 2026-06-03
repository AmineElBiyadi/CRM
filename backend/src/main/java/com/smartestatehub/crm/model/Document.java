package com.smartestatehub.crm.model;

import com.smartestatehub.ai.model.DocumentEmbedding;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_document", updatable = false, nullable = false)
    private UUID idDocument;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "document_type", nullable = false, columnDefinition = "document_type")
    private DocumentType documentType;

    @Column(name = "file_path", nullable = true)
    private String filePath;

    @Column(name = "confirmed_received", nullable = false)
    @Builder.Default
    private boolean confirmedReceived = false;

    @Column(name = "is_embedded")
    @Builder.Default
    private Boolean isEmbedded = false;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_deal", nullable = false)
    private Deal deal;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentEmbedding> embeddings;
}
