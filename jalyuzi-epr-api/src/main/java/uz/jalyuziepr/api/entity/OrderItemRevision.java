package uz.jalyuziepr.api.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.jalyuziepr.api.enums.RevisionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Joyida qayta o'lchov so'rovi — buyurtma mahsuloti o'lchami/narxini o'zgartirish
 * uchun menejer tasdig'iga yuboriladigan yozuv. Ko'rsatish uchun kerakli
 * maydonlar snapshot qilinadi (lazy yuklanishga bog'liq bo'lmasligi uchun).
 */
@Entity
@Table(name = "order_item_revisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Column(name = "order_number", length = 30)
    private String orderNumber;

    @Column(name = "order_item_id", nullable = false)
    private Long orderItemId;

    @Column(name = "product_name", length = 255)
    private String productName;

    @Column(name = "room_name", length = 100)
    private String roomName;

    @Column(name = "old_width_mm")
    private Integer oldWidthMm;

    @Column(name = "old_height_mm")
    private Integer oldHeightMm;

    @Column(name = "old_total_price", precision = 15, scale = 2)
    private BigDecimal oldTotalPrice;

    @Column(name = "new_width_mm")
    private Integer newWidthMm;

    @Column(name = "new_height_mm")
    private Integer newHeightMm;

    @Column(name = "new_total_price", precision = 15, scale = 2)
    private BigDecimal newTotalPrice;

    @Column(precision = 15, scale = 2)
    private BigDecimal delta;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private RevisionStatus status = RevisionStatus.PENDING;

    @Column(columnDefinition = "text")
    private String note;

    @Column(name = "requested_by")
    private Long requestedBy;

    @Column(name = "requested_by_name", length = 150)
    private String requestedByName;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "decided_by")
    private Long decidedBy;

    @Column(name = "decided_by_name", length = 150)
    private String decidedByName;

    @Column(name = "decision_note", columnDefinition = "text")
    private String decisionNote;

    @Column(name = "decided_at")
    private LocalDateTime decidedAt;
}
