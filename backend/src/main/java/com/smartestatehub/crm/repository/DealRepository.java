package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Deal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface DealRepository extends JpaRepository<Deal, UUID> {
}
