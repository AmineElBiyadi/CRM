package com.smartestatehub.crm.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final String uploadPreset;

    public CloudinaryService(
            @Value("${app.cloudinary.cloud-name}") String cloudName,
            @Value("${app.cloudinary.api-key}") String apiKey,
            @Value("${app.cloudinary.api-secret}") String apiSecret,
            @Value("${app.cloudinary.upload-preset}") String uploadPreset) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        ));
        this.uploadPreset = uploadPreset;

        // Diagnostic au démarrage
        try {
            var result = cloudinary.api().ping(ObjectUtils.emptyMap());
            log.info("RAG: Connexion Cloudinary OK: {}", result);
        } catch (Exception e) {
            log.error("RAG: ERREUR CRITIQUE - Connexion Cloudinary échouée (Secret incorrect?): {}", e.getMessage());
        }
    }

    /**
     * Upload a file as raw bytes to Cloudinary and return its public URL.
     */
    @SuppressWarnings("unchecked")
    public String upload(byte[] fileBytes, String publicId, String folder, String resourceType) throws IOException {
        log.info("Upload Cloudinary → folder: {}, publicId: {}, type: {}", folder, publicId, resourceType);
        Map<String, Object> options = Map.of(
                "public_id", folder + "/" + publicId,
                "resource_type", resourceType
        );
        Map<String, Object> result = cloudinary.uploader().unsignedUpload(fileBytes, uploadPreset, options);
        String url = (String) result.get("secure_url");
        log.info("Upload Cloudinary réussi. URL: {}", url);
        return url;
    }


    /**
     * Génère une liste d'URLs candidates pour un asset, pour contourner les problèmes d'ACL.
     */
    public List<String> generateCandidateUrls(String rawUrl) {
        List<String> candidates = new ArrayList<>();
        try {
            String publicId = extractPublicId(rawUrl);
            String extension = extractExtension(rawUrl);
            String version = extractVersion(rawUrl);
            String resourceType = rawUrl.contains("/raw/") ? "raw" : "image";

            String fullId = (extension != null) ? publicId + "." + extension : publicId;

            // Diagnostic via Admin API pour connaître le type réel
            String detectedType = "upload";
            try {
                var resource = cloudinary.api().resource(publicId, ObjectUtils.asMap("resource_type", resourceType));
                if (resource != null) {
                    detectedType = (String) resource.get("type");
                }
            } catch (Exception e) {
                log.warn("RAG: Impossible d'obtenir les infos Admin pour {}, fallback sur upload.", publicId);
            }

            // Strategy 1: Signed with Version (upload)
            candidates.add(cloudinary.url()
                    .resourceType(resourceType)
                    .type(detectedType)
                    .version(version)
                    .signed(true)
                    .generate(fullId));

            // Strategy 2: Signed WITHOUT Version (upload)
            candidates.add(cloudinary.url()
                    .resourceType(resourceType)
                    .type(detectedType)
                    .signed(true)
                    .generate(fullId));

            // Strategy 3: Original Public URL (upload)
            candidates.add(rawUrl);

            // Strategy 4: Signed with authenticated type (force)
            candidates.add(cloudinary.url()
                    .resourceType(resourceType)
                    .type("authenticated")
                    .version(version)
                    .signed(true)
                    .generate(fullId));

            // Strategy 5: SDK privateDownloadUrl (Query Parameters signature)
            try {
                // Map options = ObjectUtils.asMap("resource_type", resourceType);
                // candidates.add(cloudinary.privateDownloadUrl(publicId, extension, options));
                // Note: Si privateDownloadUrl n'est pas dispo, on peut le simuler :
                long timestamp = System.currentTimeMillis() / 1000L;
                Map<String, Object> params = new java.util.TreeMap<>();
                params.put("public_id", publicId);
                params.put("timestamp", String.valueOf(timestamp));
                if (version != null) params.put("version", version);
                
                String signature = cloudinary.apiSignRequest(params, cloudinary.config.apiSecret);
                String baseUrl = rawUrl.substring(0, rawUrl.indexOf("/upload/") + 8);
                String queryParams = "?api_key=" + cloudinary.config.apiKey + 
                                   "&timestamp=" + timestamp + 
                                   "&signature=" + signature;
                if (version != null) queryParams += "&version=" + version;
                
                candidates.add(baseUrl + fullId + queryParams);
            } catch (Exception e) {
                log.warn("RAG: Échec génération Strategy 5 : {}", e.getMessage());
            }

        } catch (Exception e) {
            log.error("Erreur lors de la génération des URLs candidates pour {}", rawUrl, e);
        }
        return candidates;
    }

    private String extractPublicId(String rawUrl) {
        // Simplified extraction logic for demonstration
        int uploadIndex = rawUrl.indexOf("/upload/");
        if (uploadIndex == -1) return "";
        String path = rawUrl.substring(uploadIndex + 8);
        if (path.startsWith("v")) {
            int slash = path.indexOf("/");
            path = path.substring(slash + 1);
        }
        int dot = path.lastIndexOf(".");
        return (dot != -1) ? path.substring(0, dot) : path;
    }

    private String extractExtension(String rawUrl) {
        int dot = rawUrl.lastIndexOf(".");
        return (dot != -1) ? rawUrl.substring(dot + 1) : null;
    }

    private String extractVersion(String rawUrl) {
        int uploadIndex = rawUrl.indexOf("/upload/");
        if (uploadIndex == -1) return null;
        String path = rawUrl.substring(uploadIndex + 8);
        if (path.startsWith("v")) {
            int slash = path.indexOf("/");
            return path.substring(1, slash);
        }
        return null;
    }
}
