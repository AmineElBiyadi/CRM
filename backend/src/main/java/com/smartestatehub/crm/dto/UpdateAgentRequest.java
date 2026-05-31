package com.smartestatehub.crm.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateAgentRequest(
        @NotBlank String name,
        @NotBlank @Email String email,
        String phone,
        Boolean active
) {
}
