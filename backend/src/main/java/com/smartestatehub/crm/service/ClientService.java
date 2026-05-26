package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.ClientIdentityDto;
import com.smartestatehub.crm.dto.CreateClientForm1Request;
import com.smartestatehub.crm.dto.DossierListItemDto;
import com.smartestatehub.crm.model.*;
import com.smartestatehub.crm.repository.ClientRepository;
import lombok.RequiredArgsConstructor;
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
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ClientIdentityDto> getClientIdentitiesForAgent(UUID agentId) {
        List<Client> clients = clientRepository.findClientsByAgentId(agentId);

        return clients.stream()
                .map(c -> new ClientIdentityDto(
                        c.getIdClient(),
                        c.getFirstName(),
                        c.getLastName(),
                        (c.getFirstName().charAt(0) + "" + c.getLastName().charAt(0)).toUpperCase(),
                        c.getPhone(),
                        c.getEmail(),
                        c.getSource() != null ? c.getSource() : "Inconnu",
                        (int) c.getClientFolders().stream()
                                .filter(f -> f.getAssignedAgent() != null && f.getAssignedAgent().getIdUser().equals(agentId))
                                .flatMap(f -> f.getDeals().stream())
                                .filter(d -> d.getDeletedAt() == null)
                                .count(),
                        c.getCreatedAt()
                ))
                .collect(Collectors.toList());
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
                .build();

        // Create an initial shell folder to allow the agent to manage this identity
        ClientFolder shellFolder = ClientFolder.builder()
                .client(client)
                .assignedAgent(agent)
                .createdByAgent(agent)
                .clientType(ClientType.BUYER) // Default initial link
                .build();

        client.getClientFolders().add(shellFolder);
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
                .map(d -> new DossierListItemDto(
                        d.getIdDeal(),
                        d.getClientFolder().getClientType(),
                        d.getStage(),
                        d.getAiLeadScore(),
                        d.getLastInteractionAt(),
                        d.getIsUrgent()
                ))
                .collect(Collectors.toList());
    }
}
