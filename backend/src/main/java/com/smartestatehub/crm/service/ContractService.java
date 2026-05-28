package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.ContractDto;
import com.smartestatehub.crm.model.Contract;
import com.smartestatehub.crm.model.ContractPayment;
import com.smartestatehub.crm.model.ContractStatus;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.repository.ContractRepository;
import com.smartestatehub.crm.repository.DealRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ContractService {

    private final ContractRepository contractRepository;
    private final DealRepository dealRepository;
    private final ContractPdfService contractPdfService;
    private final EmailService emailService;

    /**
     * Crée un nouveau contrat pour un dossier (deal) avec son calendrier de
     * paiement.
     */
    @Transactional
    public ContractDto.Response createContract(UUID dealId, ContractDto.CreateRequest request) {
        log.info("Création d'un contrat pour le deal ID: {}", dealId);

        Deal deal = dealRepository.findById(dealId)
                .orElseThrow(
                        () -> new IllegalArgumentException("Dossier client (Deal) non trouvé avec l'ID: " + dealId));

        Contract contract = Contract.builder()
                .deal(deal)
                .agreedPrice(request.getAgreedPrice())
                .depositAmount(request.getDepositAmount())
                .status(ContractStatus.DRAFT)
                .aiRiskSummary(request.getNotes() != null ? request.getNotes() : "Nouveau mandat de recherche.")
                .build();

        List<ContractPayment> payments = new ArrayList<>();
        if (request.getPayments() != null) {
            for (ContractDto.PaymentRequest payReq : request.getPayments()) {
                payments.add(ContractPayment.builder()
                        .contract(contract)
                        .amount(payReq.getAmount())
                        .dueDate(payReq.getDueDate())
                        .paymentOrder(payReq.getPaymentOrder())
                        .isPaid(false)
                        .build());
            }
        }
        contract.setPayments(payments);

        Contract savedContract = contractRepository.save(contract);
        log.info("Contrat créé avec succès. ID: {}", savedContract.getIdContract());

        // Génération et upload du PDF Cloudinary
        try {
            String pdfUrl = contractPdfService.generateAndUpload(savedContract);
            if (pdfUrl != null) {
                savedContract.setPdfUrl(pdfUrl);
                savedContract = contractRepository.save(savedContract);
            }
        } catch (Exception e) {
            log.warn("PDF non généré pour contrat {}: {}", savedContract.getIdContract(), e.getMessage());
        }

        return mapToResponse(savedContract);
    }

    /**
     * Récupère tous les contrats actifs liés à un deal.
     */
    public List<ContractDto.Response> getContractsByDeal(UUID dealId) {
        log.info("Récupération des contrats pour le deal ID: {}", dealId);
        return contractRepository.findByDealIdActive(dealId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Récupère un contrat par son ID.
     */
    public ContractDto.Response getContractById(UUID contractId) {
        log.info("Récupération du contrat ID: {}", contractId);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contrat non trouvé avec l'ID: " + contractId));
        return mapToResponse(contract);
    }

    /**
     * Met à jour le statut d'un contrat.
     */
    @Transactional
    public ContractDto.Response updateStatus(UUID contractId, ContractStatus newStatus) {
        log.info("Mise à jour du statut du contrat ID: {} vers {}", contractId, newStatus);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contrat non trouvé avec l'ID: " + contractId));

        contract.setStatus(newStatus);
        if (newStatus == ContractStatus.SENT) {
            contract.setSentAt(LocalDateTime.now());
            // Envoi email au client
            if (contract.getDeal() != null && contract.getDeal().getClientFolder() != null && contract.getDeal().getClientFolder().getClient() != null) {
                String clientEmail = contract.getDeal().getClientFolder().getClient().getEmail();
                String clientName = contract.getDeal().getClientFolder().getClient().getFirstName() + " "
                        + contract.getDeal().getClientFolder().getClient().getLastName();
                String pdfUrl = contract.getPdfUrl() != null ? contract.getPdfUrl() : "#";
                if (clientEmail != null && !clientEmail.isBlank()) {
                    try {
                        emailService.sendContractReadyEmail(clientEmail, clientName, pdfUrl);
                        log.info("Email contrat envoyé à {}", clientEmail);
                    } catch (Exception e) {
                        log.warn("Email non envoyé pour contrat {}: {}", contractId, e.getMessage());
                    }
                }
            }
        } else if (newStatus == ContractStatus.RECEIVED_SIGNED) {
            contract.setSignedAt(LocalDateTime.now());
        }

        Contract saved = contractRepository.save(contract);
        return mapToResponse(saved);
    }

    /**
     * Marque un versement de paiement spécifique comme payé.
     */
    @Transactional
    public ContractDto.Response markPaymentAsPaid(UUID contractId, UUID paymentId) {
        log.info("Marquage du paiement ID: {} comme payé pour le contrat ID: {}", paymentId, contractId);
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new IllegalArgumentException("Contrat non trouvé avec l'ID: " + contractId));

        boolean updated = false;
        if (contract.getPayments() != null) {
            for (ContractPayment payment : contract.getPayments()) {
                if (payment.getIdPayment().equals(paymentId)) {
                    payment.setIsPaid(true);
                    updated = true;
                    break;
                }
            }
        }

        if (!updated) {
            throw new IllegalArgumentException("Versement de paiement non trouvé avec l'ID: " + paymentId);
        }

        Contract saved = contractRepository.save(contract);
        return mapToResponse(saved);
    }

    private ContractDto.Response mapToResponse(Contract contract) {
        List<ContractDto.PaymentResponse> paymentResponses = new ArrayList<>();
        if (contract.getPayments() != null) {
            paymentResponses = contract.getPayments().stream()
                    .map(p -> ContractDto.PaymentResponse.builder()
                            .idPayment(p.getIdPayment())
                            .amount(p.getAmount())
                            .dueDate(p.getDueDate())
                            .isPaid(p.getIsPaid())
                            .paymentOrder(p.getPaymentOrder())
                            .build())
                    .collect(Collectors.toList());
        }

        return ContractDto.Response.builder()
                .idContract(contract.getIdContract())
                .agreedPrice(contract.getAgreedPrice())
                .depositAmount(contract.getDepositAmount())
                .status(contract.getStatus())
                .sentAt(contract.getSentAt())
                .signedAt(contract.getSignedAt())
                .aiRiskSummary(contract.getAiRiskSummary())
                .createdAt(contract.getCreatedAt())
                .pdfUrl(contract.getPdfUrl())
                .payments(paymentResponses)
                .build();
    }
}
