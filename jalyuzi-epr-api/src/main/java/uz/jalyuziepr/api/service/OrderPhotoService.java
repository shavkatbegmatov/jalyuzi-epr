package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.jalyuziepr.api.controller.OrderPhotoController.PhotoType;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderRepository;

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

        // Sanitar: faqat data:image/... bilan boshlanishi kerak
        if (!base64Signature.startsWith("data:image/")) {
            throw new BadRequestException("Imzo formati noto'g'ri (base64 PNG kerak)");
        }
        // Cheklash: 500 KB dan oshmasin
        if (base64Signature.length() > 700_000) {
            throw new BadRequestException("Imzo juda katta (max 500 KB)");
        }

        order.setCustomerSignature(base64Signature);
        orderRepository.save(order);
        log.info("Saved signature for order {}", orderId);
        return base64Signature;
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
