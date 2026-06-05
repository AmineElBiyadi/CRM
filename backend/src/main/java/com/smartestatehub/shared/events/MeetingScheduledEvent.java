package com.smartestatehub.shared.events;

import com.smartestatehub.crm.model.Meeting;
import lombok.Getter;
import org.springframework.context.ApplicationEvent;

@Getter
public class MeetingScheduledEvent extends ApplicationEvent {
    private final Meeting meeting;

    public MeetingScheduledEvent(Object source, Meeting meeting) {
        super(source);
        this.meeting = meeting;
    }
}
