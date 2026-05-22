package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "deals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ai_lead_score")
    private Double aiLeadScore;

    @Column(name = "ai_recommended_action")
    private String aiRecommendedAction;

    @Column(name = "ai_score_explanation", length = 2000)
    private String aiScoreExplanation;

    @Column(name = "ai_summary", length = 2000)
    private String aiSummary;

    @Column(name = "is_urgent")
    private boolean isUrgent;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealStage stage;

    @Column(name = "last_interaction_at")
    private LocalDateTime lastInteractionAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_client_profile", nullable = false)
    private ClientFolder clientFolder;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL)
    private List<Contract> contracts;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL)
    private List<Offer> offers;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL)
    private List<Meeting> meetings;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL)
    private List<Interaction> interactions;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL)
    private List<DealStageUpdate> stageUpdates;

    @OneToMany(mappedBy = "deal", cascade = CascadeType.ALL)
    private List<DealAssignment> assignments;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (stage == null) {
            stage = DealStage.COLD;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
