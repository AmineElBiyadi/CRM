package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {

    /** Propriétés liées à un dossier vendeur */
    @Query("SELECT p FROM Property p WHERE p.sellerFolder.idProfile = :sellerProfileId AND p.deletedAt IS NULL")
    List<Property> findBySellerProfileId(@Param("sellerProfileId") UUID sellerProfileId);

    /** Chercher une propriété déjà enregistrée par son URL de listing (éviter les doublons) */
    Optional<Property> findByListingUrlAndDeletedAtIsNull(String listingUrl);
}
