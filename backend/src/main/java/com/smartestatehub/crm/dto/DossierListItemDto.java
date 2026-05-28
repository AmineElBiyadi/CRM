package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;
import com.smartestatehub.crm.model.DealStage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class DossierListItemDto {
    private UUID idDeal;
    private ClientType type;
    private DealStage stage;
    private Integer aiLeadScore;
    private LocalDateTime lastInteractionAt;
    private Boolean isUrgent;
    private Boolean newDossier;
}
