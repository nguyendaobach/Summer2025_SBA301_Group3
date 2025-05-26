package com.sba301.metro_system.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "station_route")
public class StationRoute {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long stationRouteId;

    @ManyToOne
    @JoinColumn(name = "station_id")
    private Station station;

    @ManyToOne
    @JoinColumn(name = "route_id")
    private Route route;

    private Integer stationOrder;
    private BigDecimal distanceToNext;
}
