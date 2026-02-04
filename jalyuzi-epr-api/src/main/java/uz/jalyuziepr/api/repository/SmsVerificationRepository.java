package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.SmsVerification;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SmsVerificationRepository extends JpaRepository<SmsVerification, Long> {

    /**
     * Telefon raqami bo'yicha eng so'nggi tasdiqlanmagan kodni topish
     */
    Optional<SmsVerification> findFirstByPhoneAndVerifiedFalseOrderByCreatedAtDesc(String phone);

    /**
     * Telefon raqami va kod bo'yicha topish
     */
    Optional<SmsVerification> findByPhoneAndCodeAndVerifiedFalse(String phone, String code);

    /**
     * So'nggi 1 daqiqada yuborilgan kodlar soni
     */
    @Query("SELECT COUNT(s) FROM SmsVerification s WHERE s.phone = :phone AND s.createdAt > :since")
    long countRecentByPhone(@Param("phone") String phone, @Param("since") LocalDateTime since);

    /**
     * Eskirgan kodlarni o'chirish
     */
    @Modifying
    @Query("DELETE FROM SmsVerification s WHERE s.expiresAt < :now OR s.verified = true")
    void deleteExpiredAndVerified(@Param("now") LocalDateTime now);

    /**
     * Telefon raqami uchun barcha tasdiqlanmagan kodlarni o'chirish
     */
    @Modifying
    void deleteByPhoneAndVerifiedFalse(String phone);
}
