package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.jalyuziepr.api.controller.OrderPhotoController.PhotoType;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.enums.OrderStatus;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderRepository;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderPhotoService {

    private final OrderRepository orderRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public Map<String, List<String>> getAllPhotos(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        Map<String, List<String>> result = new HashMap<>();
        result.put("measurement", safeList(order.getMeasurementPhotos()));
        result.put("before", safeList(order.getPhotosBefore()));
        result.put("after", safeList(order.getPhotosAfter()));
        result.put("signature", order.getCustomerSignature() != null
                ? List.of(order.getCustomerSignature()) : List.of());
        return result;
    }

    @Transactional
    public List<String> uploadPhoto(Long orderId, PhotoType type, MultipartFile file) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        authorizeMutation(order, type);

        String url = fileStorageService.saveImage(file, "orders/" + orderId);

        List<String> list = getList(order, type);
        list.add(url);
        setList(order, type, list);

        orderRepository.save(order);
        log.info("Uploaded {} photo for order {}: {}", type, orderId, url);
        return list;
    }

    @Transactional
    public List<String> deletePhoto(Long orderId, PhotoType type, String url) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        authorizeMutation(order, type);

        List<String> list = getList(order, type);
        if (!list.remove(url)) {
            throw new BadRequestException("Bu fotosurat topilmadi");
        }
        setList(order, type, list);
        orderRepository.save(order);

        fileStorageService.delete(url);
        log.info("Deleted {} photo for order {}: {}", type, orderId, url);
        return list;
    }

    @Transactional
    public String saveSignature(Long orderId, String base64Signature) {
        if (base64Signature == null || base64Signature.isBlank()) {
            throw new BadRequestException("Imzo bo'sh");
        }
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
        authorizeMutation(order, null);

        // Sanitar: faqat data:image/... bilan boshlanishi kerak
        if (!base64Signature.startsWith("data:image/")) {
            throw new BadRequestException("Imzo formati noto'g'ri (base64 PNG kerak)");
        }
        // Cheklash: 500 KB dan oshmasin
        if (base64Signature.length() > 700_000) {
            throw new BadRequestException("Imzo juda katta (max 500 KB)");
        }
        // Base64 to'g'ri dekodlanishini oldindan tekshirish (buzuq imzo saqlanib,
        // keyin PDF yaratishda jimgina yiqilmasligi uchun)
        int comma = base64Signature.indexOf(',');
        try {
            Base64.getDecoder().decode(base64Signature.substring(comma + 1));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("Imzo Base64 formati noto'g'ri");
        }

        CustomUserDetails me = currentUser();
        order.setCustomerSignature(base64Signature);
        order.setSignatureSavedBy(me != null ? me.getId() : null);
        order.setSignatureSavedAt(java.time.LocalDateTime.now());
        orderRepository.save(order);
        log.info("Saved signature for order {} by user {}", orderId, me != null ? me.getId() : null);
        return base64Signature;
    }

    /**
     * Foto/imzo o'zgartirishni avtorizatsiya qiladi:
     *  1) Yakunlangan/terminal buyurtmada (ORNATISH_BAJARILDI va keyin) dalil
     *     o'zgartirib bo'lmaydi — imzolangan akt yaxlitligini saqlaydi.
     *  2) ORDERS_UPDATE'ga ega xodim (menejer/admin) — to'liq ruxsat.
     *  3) Faqat ORDERS_INSTALL'ga ega montajchi — faqat o'ziga tayinlangan
     *     buyurtmaning "keyin" (AFTER) fotosini va imzosini boshqaradi.
     *
     * @param type AFTER/BEFORE/MEASUREMENT yoki imzo uchun null
     */
    private void authorizeMutation(Order order, PhotoType type) {
        if (order.getStatus() != null
                && order.getStatus().getOrder() >= OrderStatus.ORNATISH_BAJARILDI.getOrder()) {
            throw new BadRequestException("O'rnatish yakunlangan — fotosurat yoki imzoni o'zgartirib bo'lmaydi");
        }

        CustomUserDetails me = currentUser();
        if (me == null) {
            throw new AccessDeniedException("Autentifikatsiya talab qilinadi");
        }
        // Menejer/admin (ORDERS_UPDATE) — barcha tur fotolarga ruxsat
        if (me.hasPermission(PermissionCode.ORDERS_UPDATE.getCode())) {
            return;
        }
        // Montajchi (faqat ORDERS_INSTALL): faqat o'ziga tayinlangan buyurtma
        if (order.getInstaller() == null || !order.getInstaller().getId().equals(me.getId())) {
            throw new AccessDeniedException("Bu buyurtma sizga tayinlanmagan");
        }
        // Montajchi faqat "keyin" fotosini boshqaradi (o'lchov/oldin — menejer ishi)
        if (type != null && type != PhotoType.AFTER) {
            throw new AccessDeniedException("Montajchi faqat \"keyin\" fotosini boshqarishi mumkin");
        }
    }

    private CustomUserDetails currentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof CustomUserDetails cud) {
            return cud;
        }
        return null;
    }

    private List<String> getList(Order order, PhotoType type) {
        List<String> list = switch (type) {
            case MEASUREMENT -> order.getMeasurementPhotos();
            case BEFORE -> order.getPhotosBefore();
            case AFTER -> order.getPhotosAfter();
        };
        return list != null ? new ArrayList<>(list) : new ArrayList<>();
    }

    private void setList(Order order, PhotoType type, List<String> list) {
        switch (type) {
            case MEASUREMENT -> order.setMeasurementPhotos(list);
            case BEFORE -> order.setPhotosBefore(list);
            case AFTER -> order.setPhotosAfter(list);
        }
    }

    private List<String> safeList(List<String> list) {
        return list != null ? list : List.of();
    }
}
