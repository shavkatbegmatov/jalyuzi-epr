package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.TelegramPhoneLink;

import java.util.Optional;

@Repository
public interface TelegramPhoneLinkRepository extends JpaRepository<TelegramPhoneLink, Long> {

    Optional<TelegramPhoneLink> findByPhone(String phone);

    Optional<TelegramPhoneLink> findByChatId(Long chatId);

    boolean existsByPhone(String phone);
}
