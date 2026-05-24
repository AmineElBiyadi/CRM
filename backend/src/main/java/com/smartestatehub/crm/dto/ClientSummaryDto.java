package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import java.util.UUID;

public record ClientSummaryDto(
    UUID idProfile,
    String firstName,
    String lastName,
    String initials,
    ClientType clientType,
    String budget,
    String stage,
    Integer aiLeadScore,
    String lastInteractionRelative
) {}
