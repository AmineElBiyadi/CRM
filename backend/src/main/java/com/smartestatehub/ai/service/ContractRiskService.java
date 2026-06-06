package com.smartestatehub.ai.service;

import com.smartestatehub.crm.model.Contract;
import com.smartestatehub.crm.model.ContractPayment;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Interaction;
import com.smartestatehub.crm.repository.ContractRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class ContractRiskService {

    private final ChatClient chatClient;
    private final ContractRepository contractRepository;

    @Transactional
    public String analyzeContractDraft(UUID contractId) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contrat introuvable"));
        Deal deal = contract.getDeal();

        // 1. Gather context
        String paymentsStr = contract.getPayments().stream()
                .sorted(Comparator.comparing(ContractPayment::getPaymentOrder))
                .map(p -> String.format("- Versement %d : %.2f $ (échéance: %s)", 
                        p.getPaymentOrder(), p.getAmount(), p.getDueDate()))
                .collect(Collectors.joining("\n"));

        String interactionsStr = deal.getInteractions().stream()
                .sorted(Comparator.comparing(Interaction::getOccurredAt).reversed())
                .limit(10)
                .map(i -> String.format("- [%s] %s : %s", i.getOccurredAt(), i.getType(), i.getDescription()))
                .collect(Collectors.joining("\n"));

        String docsStr = deal.getDocuments().stream()
                .map(d -> String.format("- %s (%s)", d.getDocumentType(), d.isConfirmedReceived() ? "Reçu" : "En attente"))
                .collect(Collectors.joining("\n"));

        // 2. Build prompt
        String prompt = String.format("""
            Tu es un expert en gestion de risques immobiliers pour l'agence 'Rawabet'.
            Ta mission est d'analyser un BROUILLON de contrat en cours de rédaction pour détecter des anomalies, des risques financiers ou juridiques, et des incohérences avec l'historique du dossier.

            DÉTAILS DU CONTRAT :
            - Prix de vente convenu : %.2f $
            - Dépôt de garantie : %.2f $ (le %s)
            - Remise des clés prévue : %s
            - Notes de l'agent : %s

            CALENDRIER DE PAIEMENT :
            %s

            CONTEXTE DU DOSSIER (Interactions récentes) :
            %s

            PIÈCES FOURNIES :
            %s

            CONSIGNES :
            1. Analyse la cohérence entre le prix, le dépôt et les interactions.
            2. Vérifie si le calendrier de paiement est équilibré et réaliste.
            3. Identifie les risques liés aux pièces manquantes.
            4. Suggère 3 points de vigilance concrets pour l'agent avant l'envoi du contrat au client.

            Réponds en Markdown avec un ton expert et constructif.
            """,
            contract.getAgreedPrice(),
            contract.getDepositAmount(),
            contract.getDepositDate(),
            contract.getKeyHandoverDate(),
            contract.getInternalNotes(),
            paymentsStr,
            interactionsStr,
            docsStr
        );

        log.info("Generating AI contract draft analysis for contract {}...", contractId);
        String analysis = chatClient.prompt()
                .user(prompt)
                .call()
                .content();

        // 3. Persist and return
        contract.setAiRiskSummary(analysis);
        contractRepository.save(contract);
        return analysis;
    }

    public String analyzeContractRisks(MultipartFile file) {
        try {
            // 1. Extract text from PDF
            String contractText = extractTextFromPdf(file);
            
            // 2. Prepare prompt for LLM
            String prompt = """
                Tu es un expert juridique spécialisé en droit immobilier.
                Analyse le texte du contrat suivant et identifie les clauses à risque, les ambiguïtés ou les points d'attention pour l'agence immobilière ou son client.
                
                Texte du contrat :
                ---
                %s
                ---
                
                Retourne une analyse structurée en Markdown avec :
                - Un résumé global du niveau de risque (Faible, Moyen, Élevé).
                - Une liste des clauses signalées avec pour chacune : le texte original (ou résumé), la nature du risque et une recommandation.
                """.formatted(contractText);

            log.info("Analyzing contract risks via LLM...");
            return chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
                    
        } catch (Exception e) {
            log.error("Error analyzing contract: {}", e.getMessage());
            throw new RuntimeException("Échec de l'analyse du contrat", e);
        }
    }

    private String extractTextFromPdf(MultipartFile file) throws IOException {
        try (PDDocument document = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(document);
        }
    }
}
