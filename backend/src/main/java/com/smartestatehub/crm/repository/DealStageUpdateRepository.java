package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.DealStageUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface DealStageUpdateRepository extends JpaRepository<DealStageUpdate, UUID> {
    List<DealStageUpdate> findByDeal_IdDealOrderByChangedAtDesc(UUID dealId);

    @Query("SELECT COUNT(DISTINCT d.idDeal) FROM DealStageUpdate dsu " +
           "JOIN dsu.deal d " +
           "JOIN d.clientFolder cf " +
           "JOIN cf.assignedAgent a " +
           "WHERE a.idUser = :agentId " +
           "AND CAST(dsu.toStage AS string) = :stage " +
           "AND dsu.changedAt >= :since")
    long countUniqueDealsByStageSince(@Param("agentId") UUID agentId, 
                                      @Param("stage") String stage, 
                                      @Param("since") LocalDateTime since);
}
