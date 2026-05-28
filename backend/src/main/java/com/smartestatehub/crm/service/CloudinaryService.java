package com.smartestatehub.crm.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Map;

@Service
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;
    private final String uploadPreset;

    public CloudinaryService(
            @Value("${app.cloudinary.cloud-name}") String cloudName,
            @Value("${app.cloudinary.upload-preset}") String uploadPreset) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "secure", true
        ));
        this.uploadPreset = uploadPreset;
    }

    /**
     * Upload a file as raw bytes to Cloudinary and return its public URL.
     *
     * @param fileBytes  raw content of the file
     * @param publicId   desired name/path in Cloudinary (without extension)
     * @param folder     Cloudinary folder (e.g. "documents", "contracts")
     * @param resourceType "raw" for PDFs/docs, "image" for images
     * @return public HTTPS URL of the uploaded resource
     */
    @SuppressWarnings("unchecked")
    public String upload(byte[] fileBytes, String publicId, String folder, String resourceType) throws IOException {
        log.info("Upload Cloudinary → folder: {}, publicId: {}, type: {}", folder, publicId, resourceType);
        Map<String, Object> options = ObjectUtils.asMap(
                "upload_preset", uploadPreset,
                "public_id", folder + "/" + publicId,
                "resource_type", resourceType,
                "overwrite", true
        );
        Map<String, Object> result = cloudinary.uploader().upload(fileBytes, options);
        String url = (String) result.get("secure_url");
        log.info("Upload Cloudinary réussi. URL: {}", url);
        return url;
    }
}
