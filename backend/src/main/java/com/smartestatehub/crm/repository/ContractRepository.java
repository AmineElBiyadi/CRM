package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Contract;
import com.smartestatehub.crm.model.ContractStatus;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    /** Tous les contrats actifs (non supprimés) d'un deal */
    @Query("SELECT c FROM Contract c WHERE c.deal.idDeal = :dealId AND c.deletedAt IS NULL ORDER BY c.createdAt DESC")
    List<Contract> findByDealIdActive(@Param("dealId") UUID dealId);

    long countByDeal_ClientFolder_AssignedAgent_IdUserAndStatusAndDeletedAtIsNull(UUID agentId, ContractStatus status);
}
