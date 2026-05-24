package com.smartestatehub.crm.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ClientIdentityDto(
    UUID idClient,
    String firstName,
    String lastName,
    String initials,
    String phone,
    String email,
    String source,
    Integer dossierCount,
    LocalDateTime createdAt
) {}
