package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.DealStage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DealRepository extends JpaRepository<Deal, UUID> {

    @Query("SELECT d FROM Deal d JOIN FETCH d.clientFolder cf JOIN FETCH cf.client WHERE cf.assignedAgent.idUser = :agentId AND d.deletedAt IS NULL ORDER BY d.aiLeadScore DESC")
    List<Deal> findActiveDossiersByAgentId(@Param("agentId") UUID agentId);

    @Query("SELECT d FROM Deal d JOIN FETCH d.clientFolder cf JOIN FETCH cf.client WHERE cf.assignedAgent.idUser = :agentId AND d.deletedAt IS NULL ORDER BY d.aiLeadScore DESC")
    List<Deal> findTop5ByAgentIdWithClient(@Param("agentId") UUID agentId, Pageable pageable);

    long countByClientFolder_AssignedAgent_IdUserAndStageNotInAndDeletedAtIsNull(UUID agentId,
            List<DealStage> excludedStages);

    @Query("SELECT AVG(d.aiLeadScore) FROM Deal d " +
           "JOIN d.clientFolder cf " +
           "JOIN cf.assignedAgent a " +
           "WHERE a.idUser = :agentId " +
           "AND d.deletedAt IS NULL " +
           "AND CAST(d.stage AS string) NOT IN ('CLOSED', 'LOST')")
    Double avgLeadScoreByAgent(@Param("agentId") UUID agentId);
}
