package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierAgentDto {
    private UUID idProfile;
    private String clientFullName;
    private ClientType clientType;
    private LocalDateTime createdAt;
    private Boolean newDossier;
}
