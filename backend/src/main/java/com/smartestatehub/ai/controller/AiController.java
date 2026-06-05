package com.smartestatehub.ai.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {
    // Ce fichier est partagé pour d'autres fonctionnalités IA génériques.
    // Les fonctionnalités RAG ont été déplacées vers DocumentRagController.
}
