package com.smartestatehub.crm.model;

import com.smartestatehub.auth.model.InternalUser;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "deal_stage_updates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DealStageUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_update")
    private Long idUpdate;

    @Enumerated(EnumType.STRING)
    @Column(name = "from_stage")
    private DealStage fromStage;

    @Enumerated(EnumType.STRING)
    @Column(name = "to_stage", nullable = false)
    private DealStage toStage;

    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_deal", nullable = false)
    private Deal deal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_user", nullable = false)
    private InternalUser user;

    @PrePersist
    protected void onCreate() {
        changedAt = LocalDateTime.now();
    }
}
