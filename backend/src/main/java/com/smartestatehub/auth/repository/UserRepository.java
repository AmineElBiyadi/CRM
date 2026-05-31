package com.smartestatehub.auth.repository;

import com.smartestatehub.auth.model.InternalUser;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<InternalUser, UUID> {

    Optional<InternalUser> findByEmail(String email);

    boolean existsByEmail(String email);
}
