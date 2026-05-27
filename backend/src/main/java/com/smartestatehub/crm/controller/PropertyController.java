package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.model.Property;
import com.smartestatehub.crm.repository.PropertyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/public/properties")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // For development
public class PropertyController {

    private final PropertyRepository propertyRepository;

    @GetMapping("/latest")
    public ResponseEntity<Property> getLatestProperty() {
        return propertyRepository.findLatestProperty()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public List<Property> getAllProperties() {
        return propertyRepository.findAll();
    }
}
