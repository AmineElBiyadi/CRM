package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.PropertyType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface PropertyTypeRepository extends JpaRepository<PropertyType, UUID> {
    Optional<PropertyType> findByGeneralTypeAndSpecificType(String generalType, String specificType);

    Optional<PropertyType> findByGeneralType(String generalType);
}
