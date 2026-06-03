package com.smartestatehub.shared.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiErrorResponse(
        String error,
        String message,
        String details
) {
    public static ApiErrorResponse of(String error, String message) {
        return new ApiErrorResponse(error, message, null);
    }

    public static ApiErrorResponse of(String error, String message, String details) {
        return new ApiErrorResponse(error, message, details);
    }
}
