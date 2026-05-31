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
            @RequestHeader("X-Agent-Id") UUID agentId) {
        return interactionService.saveInteraction(request, agentId);
    }
}
