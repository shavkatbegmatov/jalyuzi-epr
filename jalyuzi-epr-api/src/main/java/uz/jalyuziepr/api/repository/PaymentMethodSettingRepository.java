package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.PaymentMethodSetting;
import uz.jalyuziepr.api.enums.PaymentMethod;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodSettingRepository extends JpaRepository<PaymentMethodSetting, Long> {

    List<PaymentMethodSetting> findAllByOrderBySortOrderAsc();

    List<PaymentMethodSetting> findByShopEnabledTrueOrderBySortOrderAsc();

    Optional<PaymentMethodSetting> findByCode(PaymentMethod code);
}
