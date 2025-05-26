package com.sba301.metro_system.entity;

import com.sba301.metro_system.enums.Status;
import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "promotion")
public class Promotion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long promotionId;

    private String promotionName;
    private String promotionCode;
    private BigDecimal promotionDiscount;
    
    @Column(name = "from")
    private LocalDateTime fromDate;
    
    @Column(name = "to")
    private LocalDateTime toDate;

    @Enumerated(EnumType.STRING)
    private Status status;
}
