package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Offer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OfferRepository extends JpaRepository<Offer, UUID> {
    List<Offer> findByDeal_IdDeal(UUID dealId);
}
