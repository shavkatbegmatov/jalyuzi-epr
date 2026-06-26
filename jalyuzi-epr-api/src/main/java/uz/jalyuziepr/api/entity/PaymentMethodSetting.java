package uz.jalyuziepr.api.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;
import uz.jalyuziepr.api.audit.Auditable;
import uz.jalyuziepr.api.audit.AuditEntityListener;
import uz.jalyuziepr.api.entity.base.BaseEntity;
import uz.jalyuziepr.api.enums.PaymentMethod;

import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * To'lov usuli sozlamasi — admin paneldan boshqariladi.
 * Har bir {@link PaymentMethod} uchun bitta yozuv: ko'rsatiladigan nom, yoqilgan/o'chirilgan
 * holati (umumiy va onlayn-do'kon uchun alohida) va tartib raqami.
 */
@Entity
@Table(name = "payment_method_settings")
@EntityListeners({AuditingEntityListener.class, AuditEntityListener.class})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentMethodSetting extends BaseEntity implements Auditable {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private PaymentMethod code;

    /** Ko'rsatiladigan nom (admin tahrirlaydi). Masalan: "Naqd", "Qarzga". */
    @Column(nullable = false, length = 50)
    private String label;

    /** Umumiy (kassa/admin sotuvlari) uchun yoqilganmi. */
    @Column(nullable = false)
    @Builder.Default
    private Boolean enabled = true;

    /** Onlayn-do'kon checkout'ida ko'rinadimi. */
    @Column(name = "shop_enabled", nullable = false)
    @Builder.Default
    private Boolean shopEnabled = true;

    /** Ro'yxatda ko'rsatish tartibi. */
    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;

    // ============================================
    // Auditable
    // ============================================

    @Override
    public String getEntityName() {
        return "PaymentMethodSetting";
    }

    @Override
    @JsonIgnore
    public Map<String, Object> toAuditMap() {
        Map<String, Object> map = new HashMap<>();
        map.put("id", getId());
        map.put("code", this.code);
        map.put("label", this.label);
        map.put("enabled", this.enabled);
        map.put("shopEnabled", this.shopEnabled);
        map.put("sortOrder", this.sortOrder);
        return map;
    }

    @Override
    public Set<String> getSensitiveFields() {
        return Set.of();
    }
}
