package com.smartestatehub.crm.model;

import com.smartestatehub.ai.model.DocumentEmbedding;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_document")
    private Long idDocument;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "confirmed_received")
    private Boolean confirmedReceived = false;

    @Column(name = "is_embedded")
    private Boolean isEmbedded = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_deal", nullable = false)
    private Deal deal;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentEmbedding> embeddings;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
