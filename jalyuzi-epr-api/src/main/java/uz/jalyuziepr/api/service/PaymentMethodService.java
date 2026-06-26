package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.PaymentMethodSettingUpdateRequest;
import uz.jalyuziepr.api.dto.response.PaymentMethodSettingResponse;
import uz.jalyuziepr.api.entity.PaymentMethodSetting;
import uz.jalyuziepr.api.enums.PaymentMethod;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.PaymentMethodSettingRepository;

import java.util.List;

/**
 * To'lov usullari sozlamasini boshqarish xizmati (admin paneldan).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentMethodService {

    private final PaymentMethodSettingRepository repository;

    /** Barcha to'lov usullari (admin ko'rinishi). */
    public List<PaymentMethodSettingResponse> getAll() {
        return repository.findAllByOrderBySortOrderAsc().stream()
                .map(PaymentMethodSettingResponse::from)
                .toList();
    }

    /** Onlayn-do'konда ko'rinadigan (shopEnabled) to'lov usullari. */
    public List<PaymentMethodSettingResponse> getShopMethods() {
        return repository.findByShopEnabledTrueOrderBySortOrderAsc().stream()
                .map(PaymentMethodSettingResponse::from)
                .toList();
    }

    /**
     * To'lov usuli onlayn-do'kon uchun ruxsat etilganmi.
     * ShopService buyurtma yaratishda tekshiradi.
     */
    public boolean isShopMethodAllowed(PaymentMethod code) {
        if (code == null) {
            return false;
        }
        return repository.findByCode(code)
                .map(PaymentMethodSetting::getShopEnabled)
                .orElse(false);
    }

    /** To'lov usullarini ommaviy yangilash. Faqat mavjud yozuvlar (enum bo'yicha) yangilanadi. */
    @Transactional
    public List<PaymentMethodSettingResponse> update(PaymentMethodSettingUpdateRequest request) {
        for (PaymentMethodSettingUpdateRequest.Item item : request.getMethods()) {
            PaymentMethodSetting setting = repository.findByCode(item.getCode())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "To'lov usuli", "code", item.getCode()));
            setting.setLabel(item.getLabel().trim());
            setting.setEnabled(item.getEnabled());
            setting.setShopEnabled(item.getShopEnabled());
            setting.setSortOrder(item.getSortOrder());
            repository.save(setting);
        }
        log.info("To'lov usullari yangilandi: {} ta", request.getMethods().size());
        return getAll();
    }
}
