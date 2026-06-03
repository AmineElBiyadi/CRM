package com.smartestatehub.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private String refreshToken;
    private String role;          // "ADMIN" or "AGENT"
    private UUID userId;
    private String firstName;
    private String lastName;
    private String email;
}
