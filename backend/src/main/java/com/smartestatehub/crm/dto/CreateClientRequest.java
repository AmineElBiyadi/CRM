package com.smartestatehub.crm.dto;

import com.smartestatehub.crm.model.ClientType;

public record CreateClientRequest(
    Identity identity,
    Project project
) {
    public record Identity(
        String firstName,
        String lastName,
        String email,
        String phone,
        String password
    ) {}

    public record Project(
        ClientType clientType,
        Double budgetMin,
        Double budgetMax,
        String preferredArea
    ) {}
}
