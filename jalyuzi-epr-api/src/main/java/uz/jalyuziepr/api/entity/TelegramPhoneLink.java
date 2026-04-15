package uz.jalyuziepr.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * Telefon raqam va Telegram chat_id bog'liqligi
 * Bot orqali kontakt ulashilganda saqlanadi
 */
@Entity
@Table(name = "telegram_phone_links")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelegramPhoneLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "chat_id", nullable = false)
    private Long chatId;

    @Column(name = "telegram_username", length = 100)
    private String telegramUsername;

    @Column(name = "telegram_first_name", length = 100)
    private String telegramFirstName;

    @Column(name = "telegram_last_name", length = 100)
    private String telegramLastName;

    @Column(name = "verified_at", nullable = false)
    @Builder.Default
    private LocalDateTime verifiedAt = LocalDateTime.now();

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
