package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.*;
import com.smartestatehub.auth.model.InternalUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ClientPortalService {

    private final ClientRepository clientRepository;
    private final ClientFolderRepository clientFolderRepository;
    private final DealRepository dealRepository;
    private final InteractionRepository interactionRepository;
    private final MeetingRepository meetingRepository;
    private final DocumentRepository documentRepository;
    private final ContractRepository contractRepository;

    @Transactional(readOnly = true)
    public ClientPortalDataDto getFullClientPortalData(UUID clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientId));

        List<ClientFolder> folders = clientFolderRepository.findByClient_IdClient(clientId);
        List<Deal> deals = folders.stream()
                .flatMap(f -> f.getDeals().stream())
                .filter(d -> d.getDeletedAt() == null)
                .collect(Collectors.toList());

        List<UUID> dealIds = deals.stream().map(Deal::getIdDeal).collect(Collectors.toList());

        // Aggregate related entities
        List<Interaction> interactions = dealIds.stream()
                .flatMap(id -> interactionRepository.findByDeal_IdDeal(id).stream())
                .sorted(Comparator.comparing(Interaction::getOccurredAt).reversed())
                .collect(Collectors.toList());

        List<Meeting> meetings = dealIds.stream()
                .flatMap(id -> meetingRepository.findByDeal_IdDeal(id).stream())
                .sorted(Comparator.comparing(Meeting::getScheduledAt).reversed())
                .collect(Collectors.toList());

        List<Document> documents = dealIds.stream()
                .flatMap(id -> documentRepository.findByDeal_IdDeal(id).stream())
                .sorted(Comparator.comparing(Document::getCreatedAt).reversed())
                .collect(Collectors.toList());

        List<Contract> contracts = dealIds.stream()
                .flatMap(id -> contractRepository.findByDealIdActive(id).stream())
                .sorted(Comparator.comparing(Contract::getCreatedAt).reversed())
                .collect(Collectors.toList());

        // Map to DTOs
        ClientPortalDataDto.ClientProfile profile = ClientPortalDataDto.ClientProfile.builder()
                .idClient(client.getIdClient())
                .firstName(client.getFirstName())
                .lastName(client.getLastName())
                .email(client.getEmail())
                .phone(client.getPhone())
                .status(client.getStatus().name())
                .source(client.getSource())
                .assignedAgentName(folders.isEmpty() || folders.get(0).getAssignedAgent() == null ? "Non assigné" : 
                    folders.get(0).getAssignedAgent().getFirstName() + " " + folders.get(0).getAssignedAgent().getLastName())
                .build();

        List<DossierDetailDto> dossierDtos = deals.stream()
                .map(d -> mapToDossierDetail(d))
                .collect(Collectors.toList());

        List<InteractionDto> interactionDtos = interactions.stream()
                .map(this::mapToInteractionDto)
                .collect(Collectors.toList());

        List<MeetingDto> meetingDtos = meetings.stream()
                .map(this::mapToMeetingDto)
                .collect(Collectors.toList());

        List<DocumentDto> documentDtos = documents.stream()
                .map(this::mapToDocumentDto)
                .collect(Collectors.toList());

        List<ContractDto.Response> contractDtos = contracts.stream()
                .map(this::mapToContractDto)
                .collect(Collectors.toList());

        // Build Timeline
        List<ClientPortalDataDto.TimelineEvent> timeline = buildTimeline(interactions, meetings, documents, contracts, deals);

        return ClientPortalDataDto.builder()
                .profile(profile)
                .dossiers(dossierDtos)
                .interactions(interactionDtos)
                .meetings(meetingDtos)
                .documents(documentDtos)
                .contracts(contractDtos)
                .timeline(timeline)
                .build();
    }

    private DossierDetailDto mapToDossierDetail(Deal deal) {
        ClientFolder folder = deal.getClientFolder();
        Client client = folder.getClient();
        InternalUser agent = folder.getAssignedAgent();
        String agentName = (agent != null) ? agent.getFirstName() + " " + agent.getLastName() : "Non assigné";

        DossierDetailDto dto = DossierDetailDto.builder()
                .idDeal(deal.getIdDeal())
                .idProfile(folder.getIdProfile())
                .idClient(client.getIdClient())
                .clientName(client.getFirstName() + " " + client.getLastName())
                .clientEmail(client.getEmail())
                .clientPhone(client.getPhone())
                .clientSource(client.getSource())
                .clientType(folder.getClientType())
                .assignedAgentName(agentName)
                .stage(deal.getStage())
                .aiLeadScore(deal.getAiLeadScore())
                .aiScoreExplanation(deal.getAiScoreExplanation())
                .aiRecommendedAction(deal.getAiRecommendedAction())
                .aiSummary(deal.getAiSummary())
                .isUrgent(deal.getIsUrgent())
                .lastInteractionAt(deal.getLastInteractionAt())
                .build();

        if (folder.getClientType() == ClientType.BUYER && folder.getBuyerFolder() != null) {
            BuyerFolder buyer = folder.getBuyerFolder();
            dto.setBudgetMin(buyer.getBudgetMin());
            dto.setBudgetMax(buyer.getBudgetMax());
            dto.setPreferredArea(buyer.getPreferredArea());
            dto.setPreferredSizeM2(buyer.getPreferredSizeM2());
            dto.setPreferredFloor(buyer.getPreferredFloor());
            dto.setPropertyType(buyer.getPropertyType() != null ? buyer.getPropertyType().getSpecificType() : null);
        } else if (folder.getClientType() == ClientType.SELLER && folder.getSellerFolder() != null) {
            SellerFolder seller = folder.getSellerFolder();
            if (seller.getProperties() != null && !seller.getProperties().isEmpty()) {
                Property prop = seller.getProperties().get(0);
                dto.setPropertyTitle(prop.getTitle());
                dto.setAddress(prop.getAddress());
                dto.setCity(prop.getCity());
                dto.setAskingPrice(prop.getPrice());
                dto.setPropertySurfaceM2(prop.getSurfaceM2());
                dto.setNumRooms(prop.getNumRooms());
                dto.setPropertyFloor(prop.getFloor());
                dto.setPropertyType(prop.getPropertyType() != null ? prop.getPropertyType().getSpecificType() : null);
                if (prop.getImages() != null) {
                    dto.setPropertyImageUrls(prop.getImages().stream()
                            .map(PropertyImage::getImageUrl)
                            .collect(Collectors.toList()));
                }
            }
        }
        return dto;
    }

    private InteractionDto mapToInteractionDto(Interaction i) {
        return InteractionDto.builder()
                .idInteraction(i.getIdInteraction())
                .type(i.getType())
                .description(i.getDescription())
                .occurredAt(i.getOccurredAt())
                .durationMinutes(i.getDurationMinutes())
                .agentName(i.getUser() != null ? i.getUser().getFirstName() + " " + i.getUser().getLastName() : "Système")
                .build();
    }

    private MeetingDto mapToMeetingDto(Meeting m) {
        return MeetingDto.builder()
                .idMeeting(m.getIdMeeting())
                .scheduledAt(m.getScheduledAt())
                .notesLogged(m.getNotesLogged())
                .status(m.getStatus().name())
                .type(m.getType().name())
                .build();
    }

    private DocumentDto mapToDocumentDto(Document d) {
        return DocumentDto.builder()
                .idDocument(d.getIdDocument())
                .documentType(d.getDocumentType().name())
                .filePath(d.getFilePath())
                .confirmedReceived(d.getConfirmedReceived())
                .createdAt(d.getCreatedAt())
                .dealId(d.getDeal().getIdDeal())
                .build();
    }

    private ContractDto.Response mapToContractDto(Contract c) {
        return ContractDto.Response.builder()
                .idContract(c.getIdContract())
                .agreedPrice(c.getAgreedPrice())
                .depositAmount(c.getDepositAmount())
                .status(c.getStatus())
                .aiRiskSummary(c.getAiRiskSummary())
                .createdAt(c.getCreatedAt())
                .build();
    }

    private List<ClientPortalDataDto.TimelineEvent> buildTimeline(List<Interaction> interactions, List<Meeting> meetings, List<Document> documents, List<Contract> contracts, List<Deal> deals) {
        List<ClientPortalDataDto.TimelineEvent> events = new ArrayList<>();
        DateTimeFormatter iso = DateTimeFormatter.ISO_DATE_TIME;

        for (Interaction i : interactions) {
            events.add(ClientPortalDataDto.TimelineEvent.builder()
                    .type("INTERACTION")
                    .title(i.getType().name())
                    .description(i.getDescription())
                    .date(i.getOccurredAt().format(iso))
                    .agentName(i.getUser() != null ? i.getUser().getFirstName() + " " + i.getUser().getLastName() : "Système")
                    .build());
        }

        for (Meeting m : meetings) {
            events.add(ClientPortalDataDto.TimelineEvent.builder()
                    .type("MEETING")
                    .title("Rendez-vous : " + m.getType().name())
                    .description(m.getNotesLogged())
                    .date(m.getScheduledAt().format(iso))
                    .status(m.getStatus().name())
                    .build());
        }

        for (Document d : documents) {
            events.add(ClientPortalDataDto.TimelineEvent.builder()
                    .type("DOCUMENT")
                    .title("Document " + (d.getConfirmedReceived() ? "reçu" : "attendu"))
                    .description(d.getDocumentType().name())
                    .date(d.getCreatedAt().format(iso))
                    .build());
        }

        for (Contract c : contracts) {
            events.add(ClientPortalDataDto.TimelineEvent.builder()
                    .type("CONTRACT")
                    .title("Contrat " + c.getStatus().name())
                    .description("Prix convenu : " + c.getAgreedPrice() + " MAD")
                    .date(c.getCreatedAt().format(iso))
                    .build());
        }

        return events.stream()
                .sorted(Comparator.comparing(ClientPortalDataDto.TimelineEvent::getDate).reversed())
                .collect(Collectors.toList());
    }
}
