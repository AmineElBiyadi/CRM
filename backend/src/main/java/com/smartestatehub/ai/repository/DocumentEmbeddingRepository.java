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
     * On filtre par dealId pour ne chercher que dans les documents d'un client spécifique.
     */
    @Query(value = "SELECT de.* FROM document_embeddings de " +
           "JOIN documents d ON de.id_document = d.id_document " +
           "WHERE d.id_deal = :dealId " +
           "ORDER BY de.embedding <=> cast(:queryEmbedding as vector) " +
           "LIMIT :limit", nativeQuery = true)
    List<DocumentEmbedding> findSimilarChunks(
            @Param("dealId") UUID dealId, 
            @Param("queryEmbedding") String queryEmbedding, 
            @Param("limit") int limit);

    /**
     * Recherche de similarité cosinus pour TOUS les documents d'un client.
     */
    @Query(value = "SELECT de.* FROM document_embeddings de " +
           "JOIN documents d ON de.id_document = d.id_document " +
           "JOIN deals dl ON d.id_deal = dl.id_deal " +
           "JOIN client_folder cf ON dl.id_client_profile = cf.id_profile " +
           "WHERE cf.id_client = :clientId " +
           "ORDER BY de.embedding <=> cast(:queryEmbedding as vector) " +
           "LIMIT :limit", nativeQuery = true)
    List<DocumentEmbedding> findSimilarChunksForClient(
            @Param("clientId") UUID clientId, 
            @Param("queryEmbedding") String queryEmbedding, 
            @Param("limit") int limit);
}
