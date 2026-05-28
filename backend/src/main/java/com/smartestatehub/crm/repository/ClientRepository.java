package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

@Repository
public interface ClientRepository extends JpaRepository<Client, UUID> {
    Optional<Client> findByEmail(String email);
    Optional<Client> findByPhone(String phone);

    @Query(value = "SELECT DISTINCT c.* FROM client c " +
           "LEFT JOIN client_folder f ON c.id_client = f.id_client " +
           "WHERE c.deleted_at IS NULL AND (c.id_agent_creator = :agentId OR f.id_agent = :agentId OR f.created_by_agent_id = :agentId)", 
           nativeQuery = true)
    List<Client> findClientsByAgentId(@Param("agentId") UUID agentId);
}
