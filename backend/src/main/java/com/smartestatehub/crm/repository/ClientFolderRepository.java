package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.ClientFolder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface ClientFolderRepository extends JpaRepository<ClientFolder, UUID> {
}
