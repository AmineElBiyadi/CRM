package com.smartestatehub.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DossierConfirmDTO {
    private String clientType;
    // On pourrait ajouter d'autres champs spécifiques au dossier ici
}
