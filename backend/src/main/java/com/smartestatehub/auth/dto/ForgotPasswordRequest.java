package com.smartestatehub.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @NotBlank(message = "L'email est requis.")
    @Email(message = "Format d'email invalide.")
    private String email;

    @NotBlank(message = "Le type de portail est requis.")
    private String portal; // "ADMIN_AGENT" or "CLIENT"
}
