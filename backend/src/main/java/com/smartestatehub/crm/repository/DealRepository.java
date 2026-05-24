package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.DealStage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface DealRepository extends JpaRepository<Deal, UUID> {

    List<Deal> findTop5ByClientFolder_AssignedAgent_IdUserAndDeletedAtIsNullOrderByAiLeadScoreDesc(UUID agentId);

    long countByClientFolder_AssignedAgent_IdUserAndStageNotInAndDeletedAtIsNull(UUID agentId, List<DealStage> excludedStages);

    @Query("SELECT AVG(d.aiLeadScore) FROM Deal d WHERE d.clientFolder.assignedAgent.idUser = :agentId AND d.deletedAt IS NULL")
    Double avgLeadScoreByAgent(@Param("agentId") UUID agentId);
}
