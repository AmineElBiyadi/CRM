package com.smartestatehub.auth.repository;

import com.smartestatehub.auth.model.InternalUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<InternalUser, UUID> {
}
