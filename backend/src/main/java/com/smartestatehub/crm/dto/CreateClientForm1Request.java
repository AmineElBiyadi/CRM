package com.smartestatehub.crm.dto;

public record CreateClientForm1Request(
    String firstName,
    String lastName,
    String email,
    String phone,
    String source
) {}
