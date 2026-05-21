package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.OnlinePayment;
import uz.jalyuziepr.api.enums.OnlinePaymentProvider;

import java.util.Optional;

@Repository
public interface OnlinePaymentRepository extends JpaRepository<OnlinePayment, Long> {

    Optional<OnlinePayment> findByProviderAndProviderTransactionId(
            OnlinePaymentProvider provider, String providerTransactionId);

    boolean existsByProviderAndProviderTransactionId(
            OnlinePaymentProvider provider, String providerTransactionId);
}
