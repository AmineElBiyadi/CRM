package com.smartestatehub.crm.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ClientCreateDTO {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String source;

    // Dossier related fields
    private String clientType; // e.g., BUYER, SELLER
}
