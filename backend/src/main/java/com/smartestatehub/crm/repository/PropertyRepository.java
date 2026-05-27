package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyRepository extends JpaRepository<Property, UUID> {
    
    @Query("SELECT p FROM Property p ORDER BY p.createdAt DESC LIMIT 1")
    Optional<Property> findLatestProperty();
}
