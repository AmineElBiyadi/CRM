package com.smartestatehub.auth.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResetPasswordRequest {
    @NotBlank(message = "Le jeton est requis.")
    private String token;

    @NotBlank(message = "Le nouveau mot de passe est requis.")
    private String newPassword;
}
