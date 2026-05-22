package com.smartestatehub.crm.model;

import com.smartestatehub.auth.model.InternalUser;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deal_assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private LocalDateTime assignedAt;

    @Column(name = "unassigned_at")
    private LocalDateTime unassignedAt;

    @Column(name = "reson")
    private String reson;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_deal", nullable = false)
    private Deal deal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private InternalUser user;

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }
}
