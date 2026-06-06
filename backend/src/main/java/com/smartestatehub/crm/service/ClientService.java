package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.event.ClientConfirmedEvent;
import com.smartestatehub.crm.event.DossierConfirmedEvent;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.DealAssignmentRepository;
import com.smartestatehub.crm.repository.ClientFolderRepository;
import com.smartestatehub.crm.repository.ClientRepository;
import com.smartestatehub.shared.events.ClientCreatedEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Optional;

import com.smartestatehub.crm.dto.PublicOnboardingDTO.*;
import com.smartestatehub.crm.repository.PropertyTypeRepository;

import com.smartestatehub.auth.model.Role;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientFolderRepository clientFolderRepository;
    private final UserRepository userRepository;
    private final DealAssignmentRepository dealAssignmentRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;
    private final PropertyTypeRepository propertyTypeRepository;
    private final DealService dealService;

    @Transactional(readOnly = true)
    public boolean isEmailTaken(String email) {
        return clientRepository.findByEmail(email).isPresent();
    }

    @Transactional
    public Client createPublicClient(ClientStep1Request request) {
        // Validation: Email and phone should be unique
        if (clientRepository.findByEmail(request.email()).isPresent()) {
            throw new RuntimeException("EMAIL_TAKEN");
        }

        Optional<Client> existingPhone = clientRepository.findByPhone(request.phone());
        if (existingPhone.isPresent()) {
            return existingPhone.get();
        }

        Client client = Client.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phone(request.phone())
                .source(request.source())
                .password("PORTAL_PENDING") // Set as per user instruction
                .status(ClientStatus.PENDING)
                .build();

        return clientRepository.save(client);
    }

    @Transactional
    public ClientFolder createPublicDossier(DossierStep3Request request) {
        Client client = clientRepository.findById(request.clientId())
                .orElseThrow(() -> new RuntimeException("Client not found"));

        // Smart Assignment: Combine Least Loaded + Specialization
        InternalUser agent = findSmartAgent(request);

        // Create the dossier request for DealService
        CreateDossierRequest dealRequest = new CreateDossierRequest();
        dealRequest.setIdClient(client.getIdClient());
        dealRequest.setType(request.clientType());

        if (request.clientType() == ClientType.BUYER) {
            dealRequest.setBudgetMin(request.budgetMin());
            dealRequest.setBudgetMax(request.budgetMax());
            dealRequest.setPreferredArea(request.preferredArea());
            dealRequest.setSurfaceM2(request.preferredSizeM2());
            dealRequest.setFloor(request.preferredFloor());

            if (request.propertyTypeId() != null) {
                propertyTypeRepository.findById(request.propertyTypeId())
                        .ifPresent(pt -> dealRequest.setPropertySpecificType(pt.getSpecificType()));
            }
        } else {
            dealRequest.setPropertyTitle(request.propertyTitle());
            dealRequest.setAddress(request.address());
            dealRequest.setCity(request.city());
            dealRequest.setAskingPrice(request.price());
            dealRequest.setPropertySurfaceM2(request.surfaceM2());
            dealRequest.setNumRooms(request.numRooms());
            dealRequest.setPropertyFloor(request.floor());

            if (request.propertyTypeId() != null) {
                propertyTypeRepository.findById(request.propertyTypeId())
                        .ifPresent(pt -> dealRequest.setPropertySpecificType(pt.getSpecificType()));
            }
        }

        // Call DealService to handle the complex creation
        DossierSummaryDto summary = dealService.createDossier(dealRequest, agent.getIdUser());

        // Retrieve the created folder and fix fields for public onboarding
        ClientFolder folder = clientFolderRepository.findById(summary.getIdProfile())
                .orElseThrow(() -> new RuntimeException("Failed to retrieve created folder"));

        folder.setCreatedByAgent(null); // Should be null for public onboarding
        folder.setStatus(FolderStatus.PENDING); // Set status to PENDING as requested

        return clientFolderRepository.save(folder);
    }

    private InternalUser findSmartAgent(DossierStep3Request request) {
        // Priorité aux agents (Role.AGENT)
        List<InternalUser> agents = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.AGENT && u.getDeletedAt() == null)
                .toList();

        // Si aucun agent n'est trouvé, on se replie sur les admins pour éviter un crash
        if (agents.isEmpty()) {
            agents = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.ADMIN && u.getDeletedAt() == null)
                    .toList();
        }

        if (agents.isEmpty()) {
            throw new RuntimeException("No agent or admin available for assignment");
        }

        // Calculate score for each agent
        return agents.stream()
                .min((a1, a2) -> {
                    long score1 = calculateAgentScore(a1, request);
                    long score2 = calculateAgentScore(a2, request);
                    return Long.compare(score1, score2);
                })
                .orElse(agents.get(0));
    }

    private long calculateAgentScore(InternalUser agent, DossierStep3Request request) {
        List<ClientFolder> agentFolders = clientFolderRepository
                .findByAssignedAgent_IdUserAndDeletedAtIsNull(agent.getIdUser());

        // 1. Load Score (10 points per active dossier)
        long loadScore = agentFolders.stream()
                .filter(f -> f.getStatus() == FolderStatus.ACTIVE)
                .count() * 10;

        // 2. Specialization Score (Bonus points for matching city or property type)
        long specializationBonus = 0;

        String targetCity = request.clientType() == ClientType.SELLER ? request.city() : request.preferredArea();
        UUID targetTypeId = request.propertyTypeId();

        for (ClientFolder folder : agentFolders) {
            // Check City Match
            if (targetCity != null) {
                if (folder.getSellerFolder() != null && folder.getSellerFolder().getProperties() != null) {
                    for (Property p : folder.getSellerFolder().getProperties()) {
                        if (targetCity.equalsIgnoreCase(p.getCity())) {
                            specializationBonus += 2;
                            break;
                        }
                    }
                }
                if (folder.getBuyerFolder() != null
                        && targetCity.equalsIgnoreCase(folder.getBuyerFolder().getPreferredArea())) {
                    specializationBonus += 2;
                }
            }

            // Check Property Type Match
            if (targetTypeId != null) {
                if (folder.getSellerFolder() != null && folder.getSellerFolder().getProperties() != null) {
                    for (Property p : folder.getSellerFolder().getProperties()) {
                        if (p.getPropertyType() != null
                                && targetTypeId.equals(p.getPropertyType().getIdPropertyType())) {
                            specializationBonus += 3;
                            break;
                        }
                    }
                }
                if (folder.getBuyerFolder() != null && folder.getBuyerFolder().getPropertyType() != null
                        && targetTypeId.equals(folder.getBuyerFolder().getPropertyType().getIdPropertyType())) {
                    specializationBonus += 3;
                }
            }
        }

        return loadScore - specializationBonus; // Lower score is better
    }

    @Transactional(readOnly = true)
    public List<ClientIdentityDto> getClientIdentitiesForAgent(UUID agentId) {
        List<Client> clients = clientRepository.findClientsByAgentId(agentId);

        return clients.stream()
                .map(c -> {
                    int folderCount = (int) c.getClientFolders().stream()
                            .filter(f -> (f.getAssignedAgent() != null
                                    && f.getAssignedAgent().getIdUser().equals(agentId)) ||
                                    (f.getCreatedByAgent() != null
                                            && f.getCreatedByAgent().getIdUser().equals(agentId)))
                            .flatMap(f -> (f.getDeals() != null ? f.getDeals() : new java.util.ArrayList<Deal>()).stream())
                            .filter(d -> d.getDeletedAt() == null)
                            .count();
                    boolean isNew = (c.getStatus() == ClientStatus.PENDING);
                    String initials = (c.getFirstName().charAt(0) + "" + c.getLastName().charAt(0)).toUpperCase();

                    return new ClientIdentityDto(
                            c.getIdClient(),
                            c.getFirstName(),
                            c.getLastName(),
                            initials,
                            c.getPhone(),
                            c.getEmail(),
                            c.getSource() != null ? c.getSource() : "Inconnu",
                            folderCount,
                            c.getCreatedAt(),
                            isNew // this is the local boolean 'isNew' mapped to 'newClient' in record
                    );
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public Client createPendingClient(ClientCreateDTO dto) {
        Client client = Client.builder()
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .email(dto.getEmail())
                .phone(dto.getPhone())
                .source(dto.getSource())
                .password(passwordEncoder.encode("client123"))
                .status(ClientStatus.PENDING)
                .build();

        ClientFolder folder = ClientFolder.builder()
                .client(client)
                .clientType(ClientType.valueOf(dto.getClientType().toUpperCase()))
                .status(FolderStatus.PENDING)
                .build();

        client.getClientFolders().add(folder);
        return clientRepository.save(client);
    }

    @Transactional
    public void confirmClient(UUID clientId, ClientConfirmDTO dto) {
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        client.setFirstName(dto.getFirstName());
        client.setLastName(dto.getLastName());
        client.setEmail(dto.getEmail());
        client.setPhone(dto.getPhone());
        client.setStatus(ClientStatus.ACTIVE);

        clientRepository.save(client);
        eventPublisher.publishEvent(new ClientConfirmedEvent(this, client));
    }

    @Transactional
    public void confirmDossier(UUID folderId, DossierConfirmDTO dto) {
        ClientFolder folder = clientFolderRepository.findById(folderId)
                .orElseThrow(() -> new RuntimeException("Dossier not found"));

        if (dto.getClientType() != null) {
            folder.setClientType(ClientType.valueOf(dto.getClientType().toUpperCase()));
        }
        folder.setStatus(FolderStatus.ACTIVE);

        clientFolderRepository.save(folder);
        eventPublisher.publishEvent(new DossierConfirmedEvent(this, folder));
    }

    @Transactional
    public void assignDossier(UUID dossierId, UUID agentId) {
        ClientFolder folder = clientFolderRepository.findById(dossierId)
                .orElseThrow(() -> new RuntimeException("Dossier not found"));

        InternalUser newAgent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        InternalUser oldAgent = folder.getAssignedAgent();

        // Si l'agent change, on journalise
        if (oldAgent == null || !oldAgent.getIdUser().equals(agentId)) {
            folder.setAssignedAgent(newAgent);
            clientFolderRepository.save(folder);

            // Pour chaque deal dans ce dossier, on met à jour l'affectation
            if (folder.getDeals() != null) {
                for (Deal deal : folder.getDeals()) {
                    // 1. Clore l'ancienne affectation si elle existe
                    List<DealAssignment> activeAssignments = dealAssignmentRepository
                            .findByDeal_IdDealAndUnassignedAtIsNull(deal.getIdDeal());
                    for (DealAssignment da : activeAssignments) {
                        da.setUnassignedAt(LocalDateTime.now());
                        dealAssignmentRepository.save(da);
                    }

                    // 2. Créer la nouvelle affectation
                    dealAssignmentRepository.save(DealAssignment.builder()
                            .deal(deal)
                            .user(newAgent)
                            .assignedAt(LocalDateTime.now())
                            .reason("Réaffectation manuelle")
                            .build());
                }
            }
        }
    }

    @Transactional(readOnly = true)
    public Optional<Client> findExistingClient(String email, String phone) {
        var byEmail = clientRepository.findByEmail(email);
        if (byEmail.isPresent())
            return byEmail;
        return clientRepository.findByPhone(phone);
    }

    @Transactional
    public void createClientIdentity(CreateClientForm1Request request, UUID agentId) {
        if (findExistingClient(request.email(), request.phone()).isPresent()) {
            throw new RuntimeException("Client already exists with this email or phone");
        }

        InternalUser agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        String tempPassword = "Pass" + (int) (Math.random() * 9000 + 1000);

        Client client = Client.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phone(request.phone())
                .source(request.source() != null ? request.source() : "Saisie manuelle")
                .password(passwordEncoder.encode(tempPassword))
                .status(ClientStatus.ACTIVE)
                .registeredBy(agent)
                .build();

        Client saved = clientRepository.save(client);
        eventPublisher.publishEvent(new ClientCreatedEvent(this, saved, tempPassword));
    }

    @Transactional(readOnly = true)
    public List<DossierListItemDto> getClientDossiers(UUID idClient, UUID agentId) {
        Client client = clientRepository.findById(idClient)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        return client.getClientFolders().stream()
                .filter(f -> f.getAssignedAgent() != null && f.getAssignedAgent().getIdUser().equals(agentId))
                .flatMap(f -> (f.getDeals() != null ? f.getDeals() : new java.util.ArrayList<Deal>()).stream())
                .filter(d -> d.getDeletedAt() == null)
                .map(d -> DossierListItemDto.builder()
                        .idDeal(d.getIdDeal())
                        .type(d.getClientFolder().getClientType())
                        .stage(d.getStage())
                        .aiLeadScore(d.getAiLeadScore())
                        .lastInteractionAt(d.getLastInteractionAt())
                        .isUrgent(d.getIsUrgent())
                        .newDossier(d.getClientFolder().getStatus() == FolderStatus.PENDING)
                        .createdAt(d.getCreatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<DossierAgentDto> getDossierIdentitiesForAgent(UUID agentId) {
        List<ClientFolder> folders = clientFolderRepository.findByAssignedAgent_IdUserAndDeletedAtIsNull(agentId);

        return folders.stream()
                .map(f -> DossierAgentDto.builder()
                        .idProfile(f.getIdProfile())
                        .clientFullName(f.getClient().getFirstName() + " " + f.getClient().getLastName())
                        .clientType(f.getClientType())
                        .createdAt(f.getCreatedAt())
                        .newDossier(f.getStatus() == FolderStatus.PENDING)
                        .build())
                .collect(Collectors.toList());
    }
}
