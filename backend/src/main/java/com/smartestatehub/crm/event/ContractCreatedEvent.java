package com.smartestatehub.crm.event;

import com.smartestatehub.crm.model.Contract;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

/**
 * Événement déclenché lors de la création d'un contrat.
 */
@Getter
public class ContractCreatedEvent extends ApplicationEvent {
    private final Contract contract;

    public ContractCreatedEvent(Object source, Contract contract) {
        super(source);
        this.contract = contract;
    }
}
