package com.smartestatehub.crm.service;

import com.smartestatehub.auth.model.InternalUser;
import com.smartestatehub.auth.repository.UserRepository;
import com.smartestatehub.crm.dto.CreateInteractionRequest;
import com.smartestatehub.crm.dto.InteractionDto;
import com.smartestatehub.crm.event.InteractionCreatedEvent;
import com.smartestatehub.crm.model.Deal;
import com.smartestatehub.crm.model.Interaction;
import com.smartestatehub.crm.repository.DealRepository;
import com.smartestatehub.crm.repository.InteractionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InteractionService {

    private final InteractionRepository interactionRepository;
    private final DealRepository dealRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<InteractionDto> getInteractionsByDeal(UUID dealId) {
        List<Interaction> interactions = interactionRepository.findByDeal_IdDeal(dealId);
        return interactions.stream()
                .sorted(Comparator.comparing(Interaction::getOccurredAt).reversed())
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InteractionDto saveInteraction(CreateInteractionRequest request, UUID agentId, String fallbackEmail) {
        Deal deal = dealRepository.findById(request.getIdDeal())
                .orElseThrow(() -> new RuntimeException("Deal not found"));
        
        InternalUser agent = null;
        if (agentId != null) {
            agent = userRepository.findById(agentId).orElse(null);
        }
        
        if (agent == null && fallbackEmail != null) {
            agent = userRepository.findByEmail(fallbackEmail).orElse(null);
        }

        if (agent == null) {
            throw new RuntimeException("Agent/Admin not found");
        }

        Interaction interaction = Interaction.builder()
                .deal(deal)
                .user(agent)
                .type(request.getType())
                .description(request.getDescription())
                .occurredAt(request.getOccurredAt())
                .durationMinutes(request.getDurationMinutes())
                .build();

        interaction = interactionRepository.save(interaction);
        
        // Update last interaction time on deal
        deal.setLastInteractionAt(request.getOccurredAt());
        dealRepository.save(deal);

        // Publier l'événement pour que l'IA puisse réagir (résumé, scoring, etc.)
        eventPublisher.publishEvent(new InteractionCreatedEvent(this, interaction));

        return mapToDto(interaction);
    }

    @Transactional
    public InteractionDto updateInteraction(UUID idInteraction, CreateInteractionRequest request) {
        Interaction interaction = interactionRepository.findById(idInteraction)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));

        interaction.setType(request.getType());
        interaction.setDescription(request.getDescription());
        interaction.setOccurredAt(request.getOccurredAt());
        interaction.setDurationMinutes(request.getDurationMinutes());

        interaction = interactionRepository.save(interaction);
        return mapToDto(interaction);
    }

    @Transactional
    public void deleteInteraction(UUID idInteraction) {
        if (!interactionRepository.existsById(idInteraction)) {
            throw new RuntimeException("Interaction not found");
        }
        interactionRepository.deleteById(idInteraction);
    }

    private InteractionDto mapToDto(Interaction interaction) {
        String agentName = "Inconnu";
        if (interaction.getUser() != null) {
            agentName = interaction.getUser().getFirstName() + " " + interaction.getUser().getLastName();
        }
        return InteractionDto.builder()
                .idInteraction(interaction.getIdInteraction())
                .type(interaction.getType())
                .description(interaction.getDescription())
                .occurredAt(interaction.getOccurredAt())
                .durationMinutes(interaction.getDurationMinutes())
                .agentName(agentName)
                .build();
    }
}
