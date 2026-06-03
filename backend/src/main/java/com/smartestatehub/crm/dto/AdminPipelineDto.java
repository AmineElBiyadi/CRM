package com.smartestatehub.crm.dto;

import java.util.List;

public record AdminPipelineDto(
        long totalDeals,
        List<AdminPipelineStageDto> stages,
        List<AdminPipelineDealDto> deals
) {}
