package com.smartestatehub.shared.events;

import com.smartestatehub.auth.model.InternalUser;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class AgentCreatedEvent extends ApplicationEvent {
    private final InternalUser agent;
    private final String rawPassword;

    public AgentCreatedEvent(Object source, InternalUser agent, String rawPassword) {
        super(source);
        this.agent = agent;
        this.rawPassword = rawPassword;
    }
}
