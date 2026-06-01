package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.DealStageUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DealStageUpdateRepository extends JpaRepository<DealStageUpdate, UUID> {
    List<DealStageUpdate> findByDeal_IdDealOrderByChangedAtDesc(UUID dealId);
}
