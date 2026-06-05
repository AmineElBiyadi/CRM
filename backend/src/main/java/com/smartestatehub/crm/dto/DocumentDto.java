package com.smartestatehub.crm.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO pour exposer les documents sans causer de récursion infinie Jackson.
 * On exclut la relation Deal et Embeddings.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDto {
    private UUID idDocument;
    private String documentType;
    private String filePath;
    private String localFilePath;
    private Boolean confirmedReceived;
    private LocalDateTime createdAt;
    private UUID dealId;
}
