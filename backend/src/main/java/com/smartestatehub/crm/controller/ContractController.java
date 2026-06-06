package com.smartestatehub.crm.controller;

import com.smartestatehub.ai.service.ContractRiskService;
import com.smartestatehub.crm.dto.ContractDto;
import com.smartestatehub.crm.model.ContractStatus;
import com.smartestatehub.crm.service.ContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.Map;

@RestController
@RequestMapping("/api/contracts")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowedHeaders = "*", allowCredentials = "true")
public class ContractController {

    private final ContractService contractService;
    private final ContractRiskService contractRiskService;

    /**
     * POST /api/contracts/analyze-risks
     * Analyse les risques d'un fichier contrat PDF.
     */
    @PostMapping("/analyze-risks")
    public ResponseEntity<Map<String, String>> analyzeRisks(@RequestParam("file") MultipartFile file) {
        String analysis = contractRiskService.analyzeContractRisks(file);
        return ResponseEntity.ok(Map.of("analysis", analysis));
    }

    /**
     * POST /api/contracts/{contractId}/analyze
     * Analyse les risques d'un brouillon de contrat en tenant compte du contexte du dossier.
     */
    @PostMapping("/{contractId}/analyze")
    public ResponseEntity<Map<String, String>> analyzeDraft(@PathVariable("contractId") UUID contractId) {
        String analysis = contractRiskService.analyzeContractDraft(contractId);
        return ResponseEntity.ok(Map.of("analysis", analysis));
    }

    /**
     * POST /api/contracts?dealId={dealId}
     * Crée un nouveau contrat et son calendrier de paiement associé.
     */
    @PostMapping
    public ResponseEntity<ContractDto.Response> createContract(
            @RequestParam("dealId") UUID dealId,
            @RequestBody ContractDto.CreateRequest request) {
        ContractDto.Response response = contractService.createContract(dealId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/contracts/deal/{dealId}
     * Récupère tous les contrats actifs pour un dossier client.
     */
    @GetMapping("/deal/{dealId}")
    public ResponseEntity<List<ContractDto.Response>> getContractsByDeal(@PathVariable("dealId") UUID dealId) {
        List<ContractDto.Response> response = contractService.getContractsByDeal(dealId);
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/contracts/{contractId}
     * Récupère les détails d'un contrat par son ID.
     */
    @GetMapping("/{contractId}")
    public ResponseEntity<ContractDto.Response> getContractById(@PathVariable("contractId") UUID contractId) {
        ContractDto.Response response = contractService.getContractById(contractId);
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/contracts/{contractId}/status
     * Met à jour le statut du contrat (ex : DRAFT -> SENT -> SIGNED -> ARCHIVED).
     */
    @PatchMapping("/{contractId}/status")
    public ResponseEntity<ContractDto.Response> updateStatus(
            @PathVariable("contractId") UUID contractId,
            @RequestBody ContractDto.StatusUpdateRequest request) {
        ContractDto.Response response = contractService.updateStatus(contractId, request.getStatus());
        return ResponseEntity.ok(response);
    }

    /**
     * PATCH /api/contracts/{contractId}/payments/{paymentId}/paid
     * Enregistre le règlement d'un versement (marqué comme payé).
     */
    @PatchMapping("/{contractId}/payments/{paymentId}/paid")
    public ResponseEntity<ContractDto.Response> markPaymentAsPaid(
            @PathVariable("contractId") UUID contractId,
            @PathVariable("paymentId") UUID paymentId) {
        ContractDto.Response response = contractService.markPaymentAsPaid(contractId, paymentId);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/contracts/{contractId}
     * Supprime un contrat (uniquement s'il est au statut DRAFT).
     */
    @DeleteMapping("/{contractId}")
    public ResponseEntity<Void> deleteContract(@PathVariable("contractId") UUID contractId) {
        contractService.deleteContract(contractId);
        return ResponseEntity.noContent().build();
    }

    /**
     * PUT /api/contracts/{contractId}
     * Modifie un contrat existant (uniquement s'il est au statut DRAFT).
     */
    @PutMapping("/{contractId}")
    public ResponseEntity<ContractDto.Response> updateContract(
            @PathVariable("contractId") UUID contractId,
            @RequestBody ContractDto.CreateRequest request) {
        ContractDto.Response response = contractService.updateContract(contractId, request);
        return ResponseEntity.ok(response);
    }
}
