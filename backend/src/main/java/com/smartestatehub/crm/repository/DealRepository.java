package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.DealStage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DealRepository extends JpaRepository<Deal, UUID> {

    long countByDeletedAtIsNull();

    long countByDeletedAtIsNullAndStage(DealStage stage);

    long countByDeletedAtIsNullAndStageNotIn(List<DealStage> excludedStages);

    @Query("SELECT COUNT(d) FROM Deal d WHERE d.deletedAt IS NULL AND d.createdAt >= :from AND d.createdAt < :to")
    long countCreatedBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(d) FROM Deal d WHERE d.deletedAt IS NULL AND d.stage = :stage AND d.createdAt >= :from AND d.createdAt < :to")
    long countByStageCreatedBetween(
            @Param("stage") DealStage stage,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT COUNT(d) FROM Deal d WHERE d.deletedAt IS NULL AND d.stage = :stage AND d.updatedAt >= :from AND d.updatedAt < :to")
    long countClosedBetween(@Param("stage") DealStage stage, @Param("from") LocalDateTime from, @Param("to") LocalDateTime to);

    @Query("""
            SELECT COUNT(d) FROM Deal d
            WHERE d.deletedAt IS NULL
              AND d.stage = :stage
              AND d.clientFolder.assignedAgent.idUser = :agentId
              AND d.updatedAt >= :from AND d.updatedAt < :to
            """)
    long countAgentClosedBetween(
            @Param("agentId") UUID agentId,
            @Param("stage") DealStage stage,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to);

    @Query("SELECT MAX(d.lastInteractionAt) FROM Deal d WHERE d.clientFolder.assignedAgent.idUser = :agentId AND d.deletedAt IS NULL")
    LocalDateTime findLatestInteractionByAgent(@Param("agentId") UUID agentId);

    @Query("""
            SELECT d FROM Deal d
            JOIN FETCH d.clientFolder cf
            JOIN FETCH cf.client
            LEFT JOIN FETCH cf.assignedAgent
            WHERE d.deletedAt IS NULL
              AND d.stage = :stage
              AND (d.lastInteractionAt IS NULL OR d.lastInteractionAt < :threshold)
            ORDER BY d.lastInteractionAt ASC NULLS FIRST
            """)
    List<Deal> findStaleHotDeals(@Param("stage") DealStage stage, @Param("threshold") LocalDateTime threshold);

    @Query("SELECT d FROM Deal d JOIN FETCH d.clientFolder cf JOIN FETCH cf.client WHERE cf.assignedAgent.idUser = :agentId AND d.deletedAt IS NULL ORDER BY d.aiLeadScore DESC")
    List<Deal> findActiveDossiersByAgentId(@Param("agentId") UUID agentId);

    @Query("SELECT d FROM Deal d JOIN FETCH d.clientFolder cf JOIN FETCH cf.client WHERE cf.assignedAgent.idUser = :agentId AND d.deletedAt IS NULL ORDER BY d.aiLeadScore DESC")
    List<Deal> findTop5ByAgentIdWithClient(@Param("agentId") UUID agentId, Pageable pageable);

    long countByClientFolder_AssignedAgent_IdUserAndStageNotInAndDeletedAtIsNull(UUID agentId,
            List<DealStage> excludedStages);

    @Query("SELECT AVG(d.aiLeadScore) FROM Deal d WHERE d.clientFolder.assignedAgent.idUser = :agentId AND d.deletedAt IS NULL")
    Double avgLeadScoreByAgent(@Param("agentId") UUID agentId);

    @Query("""
            SELECT d FROM Deal d
            JOIN FETCH d.clientFolder cf
            JOIN FETCH cf.client
            LEFT JOIN FETCH cf.assignedAgent
            WHERE d.deletedAt IS NULL
            ORDER BY d.aiLeadScore DESC, d.lastInteractionAt DESC
            """)
    List<Deal> findAllPipelineDeals();

    @Query("""
            SELECT d FROM Deal d
            JOIN FETCH d.clientFolder cf
            JOIN FETCH cf.client
            LEFT JOIN FETCH cf.assignedAgent
            WHERE d.deletedAt IS NULL
              AND cf.assignedAgent.idUser = :agentId
            ORDER BY d.aiLeadScore DESC, d.lastInteractionAt DESC
            """)
    List<Deal> findPipelineDealsByAgent(@Param("agentId") UUID agentId);

    @Query("""
            SELECT c.source, COUNT(d)
            FROM Deal d
            JOIN d.clientFolder cf
            JOIN cf.client c
            WHERE d.deletedAt IS NULL
            GROUP BY c.source
            """)
    List<Object[]> countDealsGroupedByClientSource();

    @Query("""
            SELECT d FROM Deal d
            WHERE d.deletedAt IS NULL AND d.stage = :stage
            """)
    List<Deal> findByDeletedAtIsNullAndStage(@Param("stage") DealStage stage);

    @Query("SELECT MIN(d.createdAt) FROM Deal d WHERE d.deletedAt IS NULL")
    LocalDateTime findEarliestDealCreatedAt();
}
