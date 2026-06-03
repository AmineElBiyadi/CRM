package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.DealAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DealAssignmentRepository extends JpaRepository<DealAssignment, UUID> {
    List<DealAssignment> findByDeal_IdDeal(UUID dealId);
    
    // Pour trouver l'affectation active (celle qui n'a pas encore de date de fin)
    List<DealAssignment> findByDeal_IdDealAndUnassignedAtIsNull(UUID dealId);
}
