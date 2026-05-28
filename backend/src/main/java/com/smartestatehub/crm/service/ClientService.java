package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.*;
import com.smartestatehub.crm.event.ClientConfirmedEvent;
import com.smartestatehub.crm.event.DossierConfirmedEvent;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.ClientFolderRepository;
import com.smartestatehub.crm.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ClientService {

    private final ClientRepository clientRepository;
    private final ClientFolderRepository clientFolderRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<ClientIdentityDto> getClientIdentitiesForAgent(UUID agentId) {
        List<Client> clients = clientRepository.findClientsByAgentId(agentId);

        return clients.stream()
                .map(c -> {
                    int folderCount = (int) c.getClientFolders().stream()
                            .filter(f -> (f.getAssignedAgent() != null && f.getAssignedAgent().getIdUser().equals(agentId)) || 
                                         (f.getCreatedByAgent() != null && f.getCreatedByAgent().getIdUser().equals(agentId)))
                            .flatMap(f -> f.getDeals().stream())
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
                .password("PORTAL_PENDING")
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

        InternalUser agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        folder.setAssignedAgent(agent);
        clientFolderRepository.save(folder);
    }

    @Transactional(readOnly = true)
    public Optional<Client> findExistingClient(String email, String phone) {
        var byEmail = clientRepository.findByEmail(email);
        if (byEmail.isPresent()) return byEmail;
        return clientRepository.findByPhone(phone);
    }

    @Transactional
    public void createClientIdentity(CreateClientForm1Request request, UUID agentId) {
        if (findExistingClient(request.email(), request.phone()).isPresent()) {
            throw new RuntimeException("Client already exists with this email or phone");
        }

        InternalUser agent = userRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found: " + agentId));

        Client client = Client.builder()
                .firstName(request.firstName())
                .lastName(request.lastName())
                .email(request.email())
                .phone(request.phone())
                .source(request.source() != null ? request.source() : "Saisie manuelle")
                .password("PORTAL_PENDING")
                .status(ClientStatus.ACTIVE)
                .registeredBy(agent)
                .build();

        clientRepository.save(client);
    }

    @Transactional(readOnly = true)
    public List<DossierListItemDto> getClientDossiers(UUID idClient, UUID agentId) {
        Client client = clientRepository.findById(idClient)
                .orElseThrow(() -> new RuntimeException("Client not found"));

        return client.getClientFolders().stream()
                .filter(f -> f.getAssignedAgent() != null && f.getAssignedAgent().getIdUser().equals(agentId))
                .flatMap(f -> f.getDeals().stream())
                .filter(d -> d.getDeletedAt() == null)
                    .map(d -> DossierListItemDto.builder()
                            .idDeal(d.getIdDeal())
                            .type(d.getClientFolder().getClientType())
                            .stage(d.getStage())
                            .aiLeadScore(d.getAiLeadScore())
                            .lastInteractionAt(d.getLastInteractionAt())
                            .isUrgent(d.getIsUrgent())
                            .newDossier(d.getClientFolder().getStatus() == FolderStatus.PENDING)
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
