package com.smartestatehub.crm.controller;

import com.smartestatehub.crm.model.PropertyType;
import com.smartestatehub.crm.repository.PropertyTypeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/property-types")
@RequiredArgsConstructor
@CrossOrigin(originPatterns = "*", allowedHeaders = "*", allowCredentials = "true")
public class PropertyTypeController {

    private final PropertyTypeRepository propertyTypeRepository;

    /**
     * Retourne tous les types de propriétés groupés par general_type.
     * Format: { "Residential Properties": ["Apartment / Flat", "House", ...], ... }
     */
    @GetMapping("/grouped")
    public Map<String, List<String>> getGrouped() {
        List<PropertyType> all = propertyTypeRepository.findAll();
        return all.stream()
                .filter(pt -> pt.getDeletedAt() == null)
                .collect(Collectors.groupingBy(
                        PropertyType::getGeneralType,
                        LinkedHashMap::new,
                        Collectors.mapping(PropertyType::getSpecificType, Collectors.toList())
                ));
    }

    /**
     * Retourne la liste brute de tous les types (pour usages avancés).
     */
    @GetMapping
    public List<PropertyType> getAll() {
        return propertyTypeRepository.findAll().stream()
                .filter(pt -> pt.getDeletedAt() == null)
                .toList();
    }
}
