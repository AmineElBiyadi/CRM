package com.smartestatehub.ai.repository;

import com.smartestatehub.ai.model.DocumentEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentEmbeddingRepository extends JpaRepository<DocumentEmbedding, String> {

    /**
     * Recherche de similarité cosinus native via pgvector.
     * On cherche dans les documents du dossier spécifique ET dans la base de connaissances plateforme.
     */
    @Query(value = "SELECT de.* FROM document_embeddings de " +
           "JOIN documents d ON de.id_document = d.id_document " +
           "WHERE (d.id_deal = :dealId OR d.is_platform_document = true) " +
           "ORDER BY de.embedding <=> cast(:queryEmbedding as vector) " +
           "LIMIT :limit", nativeQuery = true)
    List<DocumentEmbedding> findSimilarChunks(
            @Param("dealId") UUID dealId, 
            @Param("queryEmbedding") String queryEmbedding, 
            @Param("limit") int limit);
}
