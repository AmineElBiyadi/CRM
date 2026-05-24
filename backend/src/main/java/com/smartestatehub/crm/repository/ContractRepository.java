package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Contract;
import com.smartestatehub.crm.model.ContractStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ContractRepository extends JpaRepository<Contract, UUID> {

    long countByDeal_ClientFolder_AssignedAgent_IdUserAndStatusAndDeletedAtIsNull(UUID agentId, ContractStatus status);
}
