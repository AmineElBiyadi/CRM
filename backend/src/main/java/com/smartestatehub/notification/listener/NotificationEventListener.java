package com.smartestatehub.notification.listener;

import com.smartestatehub.crm.event.ClientConfirmedEvent;
import com.smartestatehub.crm.event.DossierConfirmedEvent;
import com.smartestatehub.notification.service.N8nWebhookService;
import com.smartestatehub.shared.events.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final N8nWebhookService n8nWebhookService;

    @EventListener
    public void handleAgentCreated(AgentCreatedEvent event) {
        log.info("Agent created: {}", event.getAgent().getEmail());
        n8nWebhookService.triggerWorkflow("/agent-cree", "AGENT_CREATED", Map.of(
            "agentId", event.getAgent().getIdUser(),
            "firstName", event.getAgent().getFirstName(),
            "lastName", event.getAgent().getLastName(),
            "email", event.getAgent().getEmail(),
            "password", event.getRawPassword(),
            "activationLink", "http://localhost:3000/activate?email=" + event.getAgent().getEmail() // Example link
        ));
    }

    @EventListener
    public void handleClientCreated(ClientCreatedEvent event) {
        log.info("Client created: {}", event.getClient().getEmail());
        n8nWebhookService.triggerWorkflow("/nouveau-client", "CLIENT_CREATED", Map.of(
            "clientId", event.getClient().getIdClient(),
            "firstName", event.getClient().getFirstName(),
            "lastName", event.getClient().getLastName(),
            "email", event.getClient().getEmail(),
            "password", event.getTemporaryPassword()
        ));
    }

    @EventListener
    public void handleMeetingScheduled(MeetingScheduledEvent event) {
        log.info("Meeting scheduled: {}", event.getMeeting().getIdMeeting());
        var client = event.getMeeting().getDeal().getClientFolder().getClient();
        var agent = event.getMeeting().getDeal().getClientFolder().getAssignedAgent();

        n8nWebhookService.triggerWorkflow("/reunion-planifiee", "MEETING_SCHEDULED", Map.of(
            "meetingId", event.getMeeting().getIdMeeting(),
            "scheduledAt", event.getMeeting().getScheduledAt(),
            "type", event.getMeeting().getType(),
            "clientEmail", client.getEmail(),
            "clientName", client.getFirstName() + " " + client.getLastName(),
            "agentEmail", agent != null ? agent.getEmail() : "",
            "agentName", agent != null ? agent.getFirstName() + " " + agent.getLastName() : "Non assigné"
        ));
    }

    @EventListener
    public void handleMeetingCompleted(MeetingCompletedEvent event) {
        log.info("Meeting completed: {}", event.getMeeting().getIdMeeting());
        var deal = event.getMeeting().getDeal();
        var client = deal.getClientFolder().getClient();
        var agent = deal.getClientFolder().getAssignedAgent();
        
        // Concatenation for Rai (P3) as requested: type + clientName + propertyAddress
        String type = event.getMeeting().getType().toString();
        String clientName = client.getFirstName() + " " + client.getLastName();
        String address = event.getMeeting().getPropertyAddress() != null ? event.getMeeting().getPropertyAddress() : "N/A";
        String concatenatedSubject = String.format("%s avec %s - %s", type, clientName, address);

        n8nWebhookService.triggerWorkflow("/reunion-terminee", "MEETING_COMPLETED", Map.of(
            "meetingId", event.getMeeting().getIdMeeting(),
            "meetingSubject", concatenatedSubject,
            "folderId", deal.getClientFolder().getIdProfile(),
            "clientName", clientName,
            "clientEmail", client.getEmail(),
            "agentEmail", agent != null ? agent.getEmail() : "",
            "agentName", agent != null ? agent.getFirstName() + " " + agent.getLastName() : "Non assigné"
        ));
    }

    @EventListener
    public void handleContractSent(ContractSentEvent event) {
        log.info("Contract sent: {}", event.getContract().getIdContract());
        var deal = event.getContract().getDeal();
        var client = deal.getClientFolder().getClient();
        var agent = deal.getClientFolder().getAssignedAgent();
        
        // Récupérer le nom du bien s'il existe dans le résumé ou les offres
        String propertyName = "Votre bien immobilier";
        if (event.getContract().getAiRiskSummary() != null && event.getContract().getAiRiskSummary().contains("Propriété:")) {
            propertyName = event.getContract().getAiRiskSummary().split("Propriété:")[1].split("-")[0].trim();
        }

        n8nWebhookService.triggerWorkflow("/contrat-envoye", "CONTRACT_SENT", Map.of(
            "clientEmail", client.getEmail(),
            "clientName", client.getFirstName() + " " + client.getLastName(),
            "agentEmail", agent != null ? agent.getEmail() : "",
            "agentName", agent != null ? agent.getFirstName() + " " + agent.getLastName() : "Non assigné",
            "folderId", deal.getClientFolder().getIdProfile(),
            "propertyName", propertyName,
            "pdfUrl", event.getContract().getPdfUrl() != null ? event.getContract().getPdfUrl() : ""
        ));
    }

    @EventListener
    public void handleContractSigned(ContractSignedEvent event) {
        log.info("Contract signed: {}", event.getContract().getIdContract());
        var deal = event.getContract().getDeal();
        var client = deal.getClientFolder().getClient();
        var adminEmail = "admin@smartestatehub.com"; // Default or lookup

        n8nWebhookService.triggerWorkflow("/contrat-signe", "CONTRACT_SIGNED", Map.of(
            "contractId", event.getContract().getIdContract(),
            "dealId", deal.getIdDeal(),
            "folderId", deal.getClientFolder().getIdProfile(),
            "clientName", client.getFirstName() + " " + client.getLastName(),
            "clientEmail", client.getEmail(),
            "adminEmail", adminEmail
        ));
    }

    @EventListener
    public void handleClientConfirmed(ClientConfirmedEvent event) {
        log.info("Client confirmed: {}", event.getClient().getEmail());
        n8nWebhookService.triggerWorkflow("/client-confirmed", "CLIENT_CONFIRMED", Map.of(
            "clientId", event.getClient().getIdClient(),
            "email", event.getClient().getEmail(),
            "firstName", event.getClient().getFirstName(),
            "lastName", event.getClient().getLastName()
        ));
    }

    @EventListener
    public void handleDossierConfirmed(DossierConfirmedEvent event) {
        log.info("Dossier confirmed for client: {}", event.getFolder().getClient().getEmail());
        n8nWebhookService.triggerWorkflow("/dossier-confirmed", "DOSSIER_CONFIRMED", Map.of(
            "folderId", event.getFolder().getIdProfile(),
            "email", event.getFolder().getClient().getEmail(),
            "clientName", event.getFolder().getClient().getFirstName() + " " + event.getFolder().getClient().getLastName()
        ));
    }
}
