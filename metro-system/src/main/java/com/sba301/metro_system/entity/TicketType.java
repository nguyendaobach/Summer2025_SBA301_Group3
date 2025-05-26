package com.sba301.metro_system.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "ticket_type")
public class TicketType {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketTypeId;

    private String ticketName;
    private Integer validityDays;
    private String description;
    private Boolean usageLimit;
}
