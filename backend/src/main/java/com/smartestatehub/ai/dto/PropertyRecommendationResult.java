package com.smartestatehub.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Result of the AI property recommendation ranking.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PropertyRecommendationResult {
    private int rank;
    private String propertyId;
    private String title;
    private String type;
    private Integer beds;
    private Integer baths;
    private Double sizeM2;
    private Double price;
    private String imageUrl;
    private String listingUrl;
    private String justification;
}
