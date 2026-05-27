package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.PropertyImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PropertyImageRepository extends JpaRepository<PropertyImage, UUID> {
}
