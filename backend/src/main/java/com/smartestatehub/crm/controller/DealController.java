package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.dto.CreateDossierRequest;
import com.smartestatehub.crm.dto.DossierDetailDto;
import com.smartestatehub.crm.dto.DossierSummaryDto;
import com.smartestatehub.crm.dto.UpdateDossierRequest;
import com.smartestatehub.crm.model.DealStage;
import com.smartestatehub.crm.service.DealService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agent/dossiers")
@RequiredArgsConstructor
public class DealController {

    private final DealService dealService;

    @GetMapping
    public List<DossierSummaryDto> getDossiers(@RequestHeader("X-Agent-Id") UUID agentId) {
        return dealService.getDossierListingForAgent(agentId);
    }

    @PostMapping
    public DossierSummaryDto createDossier(@RequestBody CreateDossierRequest request, @RequestHeader("X-Agent-Id") UUID agentId) {
        return dealService.createDossier(request, agentId);
    }

    @GetMapping("/{id}")
    public DossierDetailDto getDossierDetail(@PathVariable("id") UUID dealId) {
        return dealService.getDossierDetail(dealId);
    }

    @PutMapping("/{id}")
    public DossierDetailDto updateDossier(@PathVariable("id") UUID id, @RequestBody UpdateDossierRequest request) {
        return dealService.updateDossier(id, request);
    }

    @PatchMapping("/{id}/stage")
    public DossierDetailDto updateDealStage(
            @PathVariable("id") UUID dealId, 
            @RequestParam("stage") DealStage stage,
            @RequestHeader("X-Agent-Id") UUID agentId) {
        return dealService.updateDealStage(dealId, stage, agentId);
    }
}
