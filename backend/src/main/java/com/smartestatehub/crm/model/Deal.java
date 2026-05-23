package com.smartestatehub.crm.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "deals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id_deal", updatable = false, nullable = false)
    private UUID idDeal;

    @Column(name = "ai_lead_score")
    private Integer aiLeadScore;

    @Column(name = "ai_recommended_action")
    private String aiRecommendedAction;

    @Column(name = "ai_score_explanation", length = 2000)
    private String aiScoreExplanation;

    @Column(name = "ai_summary", length = 2000)
    private String aiSummary;

    @Column(name = "is_urgent")
    @Builder.Default
    private Boolean isUrgent = false;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DealStage stage = DealStage.COLD;

    @Column(name = "last_interaction_at")
    private LocalDateTime lastInteractionAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
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
}
