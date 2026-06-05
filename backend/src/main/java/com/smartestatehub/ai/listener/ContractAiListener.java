package com.smartestatehub.ai.listener;

import com.smartestatehub.ai.service.DocumentRagService;
import com.smartestatehub.crm.event.ContractCreatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Écoute la création de contrats pour lancer l'audit de risque automatique via l'IA.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ContractAiListener {

    private final DocumentRagService documentRagService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleContractCreated(ContractCreatedEvent event) {
        log.info("IA (Audit): Nouveau contrat détecté pour analyse: {}", event.getContract().getIdContract());
        try {
            documentRagService  .auditContract(event.getContract());
        } catch (Exception e) {
            log.error("IA (Audit): Erreur lors de l'audit du contrat {}: {}", 
                    event.getContract().getIdContract(), e.getMessage());
        }
    }
}
