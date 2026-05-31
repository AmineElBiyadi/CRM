package com.smartestatehub.crm.service;

import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.*;
import com.smartestatehub.auth.model.InternalUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
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
    private final PasswordEncoder passwordEncoder;

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
                .assignedAgentPhone(folders.isEmpty() || folders.get(0).getAssignedAgent() == null ? null : 
                    folders.get(0).getAssignedAgent().getPhone())
                .createdAt(client.getCreatedAt())
                .updatedAt(client.getUpdatedAt())
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

    @Transactional(readOnly = true)
    public List<DossierDetailDto> getClientDossiers(UUID clientId) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientId));

        List<ClientFolder> folders = clientFolderRepository.findByClient_IdClient(clientId);
        List<Deal> deals = folders.stream()
                .flatMap(f -> f.getDeals().stream())
                .filter(d -> d.getDeletedAt() == null)
                .collect(Collectors.toList());

        return deals.stream()
                .map(this::mapToDossierDetail)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ClientPortalDataDto.TimelineEvent> getDossierActivity(UUID clientId, UUID idFolder) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found: " + clientId));

        ClientFolder folder = clientFolderRepository.findByIdProfileAndClient_IdClient(idFolder, clientId)
                .orElseThrow(() -> new RuntimeException("Dossier not found for client: " + idFolder));

        List<Deal> deals = folder.getDeals().stream()
                .filter(d -> d.getDeletedAt() == null)
                .collect(Collectors.toList());

        List<UUID> dealIds = deals.stream().map(Deal::getIdDeal).collect(Collectors.toList());

        List<Interaction> interactions = dealIds.stream()
                .flatMap(id -> interactionRepository.findByDeal_IdDeal(id).stream())
                .collect(Collectors.toList());

        List<Meeting> meetings = dealIds.stream()
                .flatMap(id -> meetingRepository.findByDeal_IdDeal(id).stream())
                .collect(Collectors.toList());

        List<Document> documents = dealIds.stream()
                .flatMap(id -> documentRepository.findByDeal_IdDeal(id).stream())
                .collect(Collectors.toList());

        List<Contract> contracts = dealIds.stream()
                .flatMap(id -> contractRepository.findByDealIdActive(id).stream())
                .collect(Collectors.toList());

        return buildTimeline(interactions, meetings, documents, contracts, deals).stream()
                .limit(5) // Get only the last 5 events
                .collect(Collectors.toList());
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

        // Compute visit status from meetings
        List<Meeting> dealMeetings = deal.getMeetings() != null ? deal.getMeetings() : List.of();
        LocalDateTime now = LocalDateTime.now();
        boolean hasFutureVisit = dealMeetings.stream()
                .anyMatch(m -> "PROPERTY_VISIT".equals(m.getType() != null ? m.getType().name() : "") && m.getScheduledAt() != null && m.getScheduledAt().isAfter(now));
        boolean hasPastVisit = dealMeetings.stream()
                .anyMatch(m -> "PROPERTY_VISIT".equals(m.getType() != null ? m.getType().name() : "") && m.getScheduledAt() != null && m.getScheduledAt().isBefore(now));

        if (hasPastVisit) {
            dto.setVisitStatus("VISITED");
        } else if (hasFutureVisit) {
            dto.setVisitStatus("VISIT_PLANNED");
        } else {
            dto.setVisitStatus("PROPOSED");
        }

        // Map collections
        dto.setContracts(deal.getContracts() != null ? deal.getContracts().stream()
                .filter(c -> c.getDeletedAt() == null)
                .map(this::mapToContractDto)
                .collect(Collectors.toList()) : List.of());

        dto.setOffers(deal.getOffers() != null ? deal.getOffers().stream()
                .map(this::mapToOfferDetailDto)
                .collect(Collectors.toList()) : List.of());

        // For properties, we can show those linked to offers or those visited
        Set<Property> dealProperties = new HashSet<>();
        if (deal.getOffers() != null) {
            deal.getOffers().forEach(o -> dealProperties.add(o.getProperty()));
        }
        // Also add properties from meetings if they were visits
        if (deal.getMeetings() != null) {
            deal.getMeetings().stream()
                .filter(m -> "PROPERTY_VISIT".equals(m.getType() != null ? m.getType().name() : "") 
                        && m.getOffer() != null && m.getOffer().getProperty() != null)
                .forEach(m -> dealProperties.add(m.getOffer().getProperty()));
        }

        dto.setProperties(dealProperties.stream()
                .map(p -> mapToPropertyResponse(p, deal))
                .collect(Collectors.toList()));

        // Map aiRecommendedAction to client-friendly language
        String action = deal.getAiRecommendedAction();
        if (action != null) {
            String lower = action.toLowerCase();
            if (lower.contains("contract")) {
                dto.setClientFriendlyAction("Votre agent prépare les documents contractuels.");
            } else if (lower.contains("visit") || lower.contains("visite")) {
                dto.setClientFriendlyAction("Une visite est en cours de planification.");
            } else if (lower.contains("analys") || lower.contains("qualify") || lower.contains("qualifier")) {
                dto.setClientFriendlyAction("Votre agent analyse votre projet.");
            } else if (lower.contains("email")) {
                dto.setClientFriendlyAction("Votre agent va vous contacter prochainement.");
            } else {
                dto.setClientFriendlyAction(action);
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
                .scheduledAt(m.getScheduledAt() != null ? m.getScheduledAt().format(java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME) : null)
                .notesLogged(m.getNotesLogged())
                .propertyAddress(m.getPropertyAddress())
                .reminder1hSent(m.isReminder1hSent())
                .reminder24hSent(m.isReminder24hSent())
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

    private OfferDetailDto mapToOfferDetailDto(Offer o) {
        Property p = o.getProperty();
        return OfferDetailDto.builder()
                .idOffer(o.getIdOffer())
                .offerAmount(o.getOfferAmount())
                .status(o.getStatus().name())
                .createdAt(o.getCreatedAt())
                .idProperty(p.getIdProperty())
                .propertyTitle(p.getTitle())
                .propertyPrice(p.getPrice())
                .propertyImage(p.getImages() != null && !p.getImages().isEmpty() ? p.getImages().get(0).getImageUrl() : null)
                .build();
    }

    private PropertyDto.Response mapToPropertyResponse(Property p, Deal deal) {
        String visitStatus = "PROPOSED";
        if (deal.getMeetings() != null) {
            LocalDateTime now = LocalDateTime.now();
            boolean hasPastVisit = deal.getMeetings().stream()
                .anyMatch(m -> "PROPERTY_VISIT".equals(m.getType() != null ? m.getType().name() : "") 
                    && m.getOffer() != null && m.getOffer().getProperty() != null && m.getOffer().getProperty().getIdProperty().equals(p.getIdProperty())
                    && m.getScheduledAt() != null && m.getScheduledAt().isBefore(now));
            
            boolean hasFutureVisit = deal.getMeetings().stream()
                .anyMatch(m -> "PROPERTY_VISIT".equals(m.getType() != null ? m.getType().name() : "") 
                    && m.getOffer() != null && m.getOffer().getProperty() != null && m.getOffer().getProperty().getIdProperty().equals(p.getIdProperty())
                    && m.getScheduledAt() != null && m.getScheduledAt().isAfter(now));
            
            if (hasPastVisit) visitStatus = "VISITED";
            else if (hasFutureVisit) visitStatus = "VISIT_PLANNED";
        }

        return PropertyDto.Response.builder()
                .idProperty(p.getIdProperty())
                .title(p.getTitle())
                .address(p.getAddress())
                .city(p.getCity())
                .price(p.getPrice())
                .surfaceM2(p.getSurfaceM2())
                .numRooms(p.getNumRooms())
                .floor(p.getFloor())
                .listingUrl(p.getListingUrl())
                .isAvailable(p.isAvailable())
                .visitStatus(visitStatus)
                .imageUrls(p.getImages() != null ? p.getImages().stream()
                        .map(PropertyImage::getImageUrl)
                        .collect(Collectors.toList()) : List.of())
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

    @Transactional
    public void updateProfile(UUID clientId, UpdateClientProfileDto dto) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));
        
        if (dto.getFirstName() != null) client.setFirstName(dto.getFirstName());
        if (dto.getLastName() != null) client.setLastName(dto.getLastName());
        if (dto.getEmail() != null) client.setEmail(dto.getEmail());
        if (dto.getPhone() != null) client.setPhone(dto.getPhone());
        
        clientRepository.save(client);
    }

    @Transactional
    public void sendMessage(UUID clientId, String content) {
        // Find the active deal for this client
        List<ClientFolder> folders = clientFolderRepository.findByClient_IdClient(clientId);
        if (folders.isEmpty()) throw new RuntimeException("No folder found for client");

        ClientFolder folder = folders.get(0);
        if (folder.getDeals() == null || folder.getDeals().isEmpty()) throw new RuntimeException("No deal found");

        Deal deal = folder.getDeals().get(0);
        InternalUser agent = folder.getAssignedAgent();
        if (agent == null) throw new RuntimeException("No agent assigned");

        Interaction interaction = Interaction.builder()
                .type(InteractionType.NOTE)
                .description("[Message client] " + content)
                .deal(deal)
                .user(agent)
                .build();

        interactionRepository.save(interaction);
    }

    @Transactional
    public void acceptMeeting(UUID clientId, UUID meetingId) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));

        // Verify that the meeting belongs to the client
        if (!meeting.getDeal().getClientFolder().getClient().getIdClient().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à ce rendez-vous");
        }

        meeting.setStatus(MeetingStatus.SCHEDULED);
        meetingRepository.save(meeting);
    }

    @Transactional
    public void rescheduleMeeting(UUID clientId, UUID meetingId, LocalDateTime newDate, String reason) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));

        if (!meeting.getDeal().getClientFolder().getClient().getIdClient().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à ce rendez-vous");
        }

        meeting.setScheduledAt(newDate);
        meeting.setStatus(MeetingStatus.POSTPONED);
        meeting.setNotesLogged((meeting.getNotesLogged() != null ? meeting.getNotesLogged() + "\n" : "") + "[Reprogrammation client] Motif: " + reason);
        meetingRepository.save(meeting);
    }

    @Transactional
    public void cancelMeeting(UUID clientId, UUID meetingId, String reason) {
        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Rendez-vous non trouvé"));

        if (!meeting.getDeal().getClientFolder().getClient().getIdClient().equals(clientId)) {
            throw new RuntimeException("Accès non autorisé à ce rendez-vous");
        }

        meeting.setStatus(MeetingStatus.CANCELED);
        meeting.setNotesLogged((meeting.getNotesLogged() != null ? meeting.getNotesLogged() + "\n" : "") + "[Annulation client] Motif: " + reason);
        meetingRepository.save(meeting);
    }

    @Transactional
    public void updatePassword(UUID clientId, ChangePasswordDto dto) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client non trouvé"));

        // Vérifier le mot de passe actuel
        if (!passwordEncoder.matches(dto.getOldPassword(), client.getPassword())) {
            throw new RuntimeException("Le mot de passe actuel est incorrect");
        }

        client.setPassword(passwordEncoder.encode(dto.getNewPassword()));
        clientRepository.save(client);
    }
}
