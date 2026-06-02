package com.smartestatehub.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Structure de données retournée par l'IA pour le scoring d'un lead.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LeadScoreResult {
    private Integer score;             // 0 à 100
    private String explanation;       // Explication en langage naturel
    private String recommendedAction;  // Action concrète à faire par l'agent
    private Boolean isUrgent;         // Si le lead nécessite une attention immédiate
}
