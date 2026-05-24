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

    @Query("SELECT DISTINCT c FROM Client c LEFT JOIN FETCH c.clientFolders f LEFT JOIN FETCH f.assignedAgent WHERE f.assignedAgent.idUser = :agentId AND c.deletedAt IS NULL")
    List<Client> findClientsByAgentId(@Param("agentId") UUID agentId);
}
