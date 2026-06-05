package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Interaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface InteractionRepository extends JpaRepository<Interaction, UUID> {
    java.util.List<Interaction> findByDeal_IdDeal(java.util.UUID idDeal);
    java.util.List<Interaction> findTop3ByDeal_IdDealOrderByOccurredAtDesc(java.util.UUID idDeal);
}
