package com.smartestatehub.crm.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OfferDetailDto {
    private UUID idOffer;
    private Double offerAmount;
    private String status;
    private LocalDateTime createdAt;
    private UUID idProperty;
    private String propertyTitle;
    private Double propertyPrice;
    private String propertyImage;
}
