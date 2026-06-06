package com.smartestatehub.notification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * Service to call n8n webhooks.
 * This connects the backend events to Personne 3 (Rai)'s workflows.
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class N8nWebhookService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.n8n.webhook-url}")
    private String n8nBaseUrl;

    public void triggerWorkflow(String endpointPath, String eventType, Map<String, Object> data) {
        if (n8nBaseUrl == null || n8nBaseUrl.isBlank()) {
            log.warn("[n8n] No webhook URL configured. Event {} skipped.", eventType);
            return;
        }

        try {
            // Clean endpoint path (remove leading slash if present to avoid double slashes)
            String path = endpointPath.startsWith("/") ? endpointPath.substring(1) : endpointPath;
            String fullUrl = n8nBaseUrl.endsWith("/") ? n8nBaseUrl + path : n8nBaseUrl + "/" + path;

            java.util.Map<String, Object> payload = new java.util.HashMap<>(data);
            payload.put("event", eventType);
            payload.put("timestamp", System.currentTimeMillis());
            
            log.info("[n8n] Triggering workflow for event: {} at URL: {}", eventType, fullUrl);
            restTemplate.postForEntity(fullUrl, payload, Void.class);
        } catch (Exception e) {
            log.error("[n8n] Error triggering workflow {}: {}", eventType, e.getMessage());
        }
    }
}
