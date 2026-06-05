package com.smartestatehub.ai.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class ContractRiskService {

    private final ChatClient chatClient;

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
