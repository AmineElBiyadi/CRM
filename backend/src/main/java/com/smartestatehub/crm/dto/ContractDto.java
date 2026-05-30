package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ContractStatus;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public class ContractDto {

    /* ── Request : créer un contrat ── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateRequest {
        private Double agreedPrice;
        private Double depositAmount;
        private String notes;
        /** Liste des versements planifiés */
        private List<PaymentRequest> payments;
    }

    /* ── Request : modifier le statut ── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusUpdateRequest {
        private ContractStatus status;
    }

    /* ── Request : créer un versement ── */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentRequest {
        private Double amount;
        private LocalDate dueDate;
        private Integer paymentOrder;
    }

    /* ── Response : contrat complet ── */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private UUID idContract;
        private Double agreedPrice;
        private Double depositAmount;
        private ContractStatus status;
        private LocalDateTime sentAt;
        private LocalDateTime signedAt;
        private String aiRiskSummary;
        private LocalDateTime createdAt;
        private String pdfUrl;
        private List<PaymentResponse> payments;
    }

    /* ── Response : versement ── */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResponse {
        private UUID idPayment;
        private Double amount;
        private LocalDate dueDate;
        private Boolean isPaid;
        private Integer paymentOrder;
    }
}
