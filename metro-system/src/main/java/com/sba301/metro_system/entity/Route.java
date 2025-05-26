package com.sba301.metro_system.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "route")
public class Route {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long routeId;

    @Column(unique = true)
    private String routeName;
    
    private String routeDescription;

    @ManyToOne
    @JoinColumn(name = "rule_id")
    private TicketRule ticketRule;
}
