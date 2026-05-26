package com.smartestatehub.crm.repository;

import com.smartestatehub.crm.model.Meeting;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface MeetingRepository extends JpaRepository<Meeting, UUID> {

    @Query("SELECT m FROM Meeting m " +
           "WHERE m.deal.clientFolder.assignedAgent.idUser = :agentId " +
           "AND m.scheduledAt >= :start AND m.scheduledAt < :end " +
           "AND m.deletedAt IS NULL " +
           "ORDER BY m.scheduledAt ASC")
    List<Meeting> findTodayMeetingsByAgent(@Param("agentId") UUID agentId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT m FROM Meeting m " +
           "WHERE m.deal.clientFolder.assignedAgent.idUser = :agentId " +
           "AND m.scheduledAt >= :monthStart AND m.scheduledAt < :monthEnd " +
           "AND m.deletedAt IS NULL " +
           "ORDER BY m.scheduledAt ASC")
    List<Meeting> findMonthMeetingsByAgent(@Param("agentId") UUID agentId, @Param("monthStart") LocalDateTime monthStart, @Param("monthEnd") LocalDateTime monthEnd);

    @Query("SELECT m FROM Meeting m " +
           "WHERE m.deal.clientFolder.assignedAgent.idUser = :agentId " +
           "AND m.scheduledAt >= :weekStart AND m.scheduledAt < :weekEnd " +
           "AND m.deletedAt IS NULL " +
           "ORDER BY m.scheduledAt ASC")
    List<Meeting> findWeekMeetingsByAgent(@Param("agentId") UUID agentId, @Param("weekStart") LocalDateTime weekStart, @Param("weekEnd") LocalDateTime weekEnd);

    @Query("SELECT m FROM Meeting m " +
           "WHERE m.deal.idDeal = :idDeal " +
           "AND m.deletedAt IS NULL " +
           "ORDER BY m.scheduledAt DESC")
    List<Meeting> findByDeal_IdDeal(@Param("idDeal") UUID idDeal);

    @Query("SELECT COUNT(m) FROM Meeting m " +
           "WHERE m.deal.clientFolder.assignedAgent.idUser = :agentId " +
           "AND m.scheduledAt >= :weekStart AND m.scheduledAt < :weekEnd " +
           "AND m.deletedAt IS NULL")
    long countWeekMeetingsByAgent(@Param("agentId") UUID agentId, @Param("weekStart") LocalDateTime weekStart, @Param("weekEnd") LocalDateTime weekEnd);
}
