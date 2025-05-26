package com.sba301.metro_system.entity;

import com.sba301.metro_system.enums.Status;
import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "ticket_rule")
public class TicketRule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ruleId;

    private Double basePrice;
    private Double pricePerKm;

    @Enumerated(EnumType.STRING)
    private Status status;
}
