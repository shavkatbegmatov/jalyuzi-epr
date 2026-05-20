package uz.jalyuziepr.api.entity;

import jakarta.persistence.*;
import lombok.*;
import uz.jalyuziepr.api.entity.base.BaseEntity;

/**
 * Ishlab chiqarish bosqichi shabloni (katalog).
 * Admin tomonidan sozlanadi: Qirqim, Tikuv, Yig'ish, QA, Tayyor va h.k.
 */
@Entity
@Table(name = "production_stages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductionStage extends BaseEntity {

    @Column(nullable = false, unique = true, length = 30)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private Integer sequence;

    @Column(length = 20)
    @Builder.Default
    private String color = "#6366f1";

    @Column(name = "estimated_minutes")
    @Builder.Default
    private Integer estimatedMinutes = 60;

    @Column(name = "requires_qa", nullable = false)
    @Builder.Default
    private Boolean requiresQa = false;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
}
