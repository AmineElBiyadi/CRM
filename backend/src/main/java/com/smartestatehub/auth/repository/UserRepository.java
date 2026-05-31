package com.smartestatehub.auth.repository;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<InternalUser, UUID> {

    Optional<InternalUser> findByEmail(String email);

    boolean existsByEmail(String email);

    List<InternalUser> findByRoleAndDeletedAtIsNullOrderByLastNameAsc(Role role);

    List<InternalUser> findByRoleOrderByLastNameAsc(Role role);
}
