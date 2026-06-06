package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.CreateInteractionRequest;
import com.smartestatehub.crm.dto.InteractionDto;
import com.smartestatehub.crm.service.InteractionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agent/interactions")
@RequiredArgsConstructor
public class InteractionController {

    private final InteractionService interactionService;

    @GetMapping("/deal/{idDeal}")
    public List<InteractionDto> getInteractions(@PathVariable UUID idDeal) {
        return interactionService.getInteractionsByDeal(idDeal);
    }

    @PostMapping
    public InteractionDto createInteraction(
            @RequestBody CreateInteractionRequest request,
            @RequestHeader(value = "X-Agent-Id", required = false) UUID agentId,
            java.security.Principal principal) {
        String email = principal != null ? principal.getName() : null;
        return interactionService.saveInteraction(request, agentId, email);
    }

    @PutMapping("/{id}")
    public InteractionDto updateInteraction(
            @PathVariable UUID id,
            @RequestBody CreateInteractionRequest request) {
        return interactionService.updateInteraction(id, request);
    }

    @DeleteMapping("/{id}")
    public void deleteInteraction(@PathVariable UUID id) {
        interactionService.deleteInteraction(id);
    }
}
