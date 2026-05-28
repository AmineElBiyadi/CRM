package com.smartestatehub.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientConfirmDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
}
