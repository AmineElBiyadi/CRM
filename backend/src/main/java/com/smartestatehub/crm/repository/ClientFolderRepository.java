package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.ClientFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.List;

@Repository
public interface ClientFolderRepository extends JpaRepository<ClientFolder, UUID> {
    List<ClientFolder> findByAssignedAgent_IdUserAndDeletedAtIsNull(UUID agentId);
}
