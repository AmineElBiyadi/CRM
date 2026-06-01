package com.smartestatehub.crm.event;

import com.smartestatehub.crm.model.Interaction;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Événement déclenché lorsqu'une nouvelle interaction est enregistrée dans le CRM.
 * Permet au moteur IA de recalculer le score ou de mettre à jour le résumé.
 */
@Getter
public class InteractionCreatedEvent extends ApplicationEvent {
    private final Interaction interaction;

    public InteractionCreatedEvent(Object source, Interaction interaction) {
        super(source);
        this.interaction = interaction;
    }
}
