package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import uz.jalyuziepr.api.entity.Product;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.ProductRepository;

import java.util.ArrayList;
import java.util.List;

/**
 * Mahsulot rasmlari (galereya) boshqaruvi: yuklash, o'chirish, muqovani tanlash.
 * Fayllar FileStorageService orqali "products/{id}" kategoriyasiga saqlanadi.
 * URL'lar Product.imageUrls (JSONB) ro'yxatida saqlanadi; Product.imageUrl — muqova.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImageService {

    private static final int MAX_IMAGES = 10;

    private final ProductRepository productRepository;
    private final FileStorageService fileStorageService;

    @Transactional(readOnly = true)
    public List<String> getImages(Long productId) {
        Product product = findProduct(productId);
        return safeList(product.getImageUrls());
    }

    @Transactional
    public List<String> uploadImage(Long productId, MultipartFile file) {
        Product product = findProduct(productId);

        List<String> images = new ArrayList<>(safeList(product.getImageUrls()));
        if (images.size() >= MAX_IMAGES) {
            throw new BadRequestException("Mahsulotga eng ko'pi " + MAX_IMAGES + " ta rasm yuklash mumkin");
        }

        String url = fileStorageService.saveImage(file, "products/" + productId);
        images.add(url);
        product.setImageUrls(images);

        // Muqova bo'sh bo'lsa — birinchi rasmni muqova qilamiz
        if (product.getImageUrl() == null || product.getImageUrl().isBlank()) {
            product.setImageUrl(url);
        }

        productRepository.save(product);
        log.info("Uploaded image for product {}: {}", productId, url);
        return images;
    }

    @Transactional
    public List<String> deleteImage(Long productId, String url) {
        Product product = findProduct(productId);

        List<String> images = new ArrayList<>(safeList(product.getImageUrls()));
        if (!images.remove(url)) {
            throw new BadRequestException("Bu rasm topilmadi");
        }
        product.setImageUrls(images);

        // O'chirilgan rasm muqova bo'lsa — keyingi rasmni muqova qilamiz (yoki bo'shatamiz)
        if (url.equals(product.getImageUrl())) {
            product.setImageUrl(images.isEmpty() ? null : images.get(0));
        }

        productRepository.save(product);
        fileStorageService.delete(url);
        log.info("Deleted image for product {}: {}", productId, url);
        return images;
    }

    /**
     * Berilgan rasmni asosiy (muqova) rasm sifatida belgilaydi.
     */
    @Transactional
    public List<String> setCover(Long productId, String url) {
        Product product = findProduct(productId);

        List<String> images = safeList(product.getImageUrls());
        if (!images.contains(url)) {
            throw new BadRequestException("Bu rasm galereyada topilmadi");
        }
        product.setImageUrl(url);
        productRepository.save(product);
        log.info("Set cover image for product {}: {}", productId, url);
        return images;
    }

    private Product findProduct(Long productId) {
        return productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", productId));
    }

    private List<String> safeList(List<String> list) {
        return list != null ? list : new ArrayList<>();
    }
}
