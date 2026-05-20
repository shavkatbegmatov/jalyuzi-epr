package uz.jalyuziepr.api.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import uz.jalyuziepr.api.exception.BadRequestException;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Fayllarni lokal disk'ga saqlaydi.
 * Production'da S3 yoki shu kabi tashqi storage bilan almashtirilishi mumkin
 * (interfacega o'zgartirish).
 *
 * Saqlash strukturasi:
 *   {upload-dir}/{category}/{YYYY-MM-DD}/{uuid}.{ext}
 * Public URL:
 *   {publicUrlPrefix}/{category}/{YYYY-MM-DD}/{uuid}.{ext}
 */
@Service
@Slf4j
public class FileStorageService {

    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of(
            "image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"
    );

    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            ".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"
    );

    private static final DateTimeFormatter DATE_DIR = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final long MAX_BYTES = 10L * 1024 * 1024; // 10 MB

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDir;

    @Value("${app.storage.public-url-prefix:/api/files}")
    private String publicUrlPrefix;

    private Path root;

    @PostConstruct
    public void init() {
        try {
            root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(root);
            log.info("File storage initialized at {}", root);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to initialize upload directory: " + uploadDir, e);
        }
    }

    /**
     * Faylni saqlaydi va public URL qaytaradi.
     *
     * @param file rasm fayli
     * @param category kategoriya (masalan "orders", "products") — fayllarni guruhlash
     * @return public URL (masalan "/api/files/orders/2026-05-21/uuid.jpg")
     */
    public String saveImage(MultipartFile file, String category) {
        validateImage(file);

        try {
            String ext = extractExtension(file.getOriginalFilename());
            String dateDir = LocalDate.now().format(DATE_DIR);
            String filename = UUID.randomUUID() + ext;

            Path dir = root.resolve(category).resolve(dateDir);
            Files.createDirectories(dir);

            Path target = dir.resolve(filename);
            Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

            String relativePath = category + "/" + dateDir + "/" + filename;
            String publicUrl = publicUrlPrefix + "/" + relativePath;

            log.info("Saved file {} ({} bytes) → {}", filename, file.getSize(), target);
            return publicUrl;
        } catch (IOException e) {
            log.error("Failed to save file: {}", e.getMessage(), e);
            throw new BadRequestException("Faylni saqlab bo'lmadi: " + e.getMessage());
        }
    }

    /**
     * Public URL'dan lokal disk Path'ini olish (static fayl serve qilish uchun).
     */
    public Path resolveByPublicUrl(String publicPath) {
        // publicPath: "orders/2026-05-21/uuid.jpg" (prefix olib tashlangan)
        Path target = root.resolve(publicPath).normalize();
        if (!target.startsWith(root)) {
            throw new BadRequestException("Noto'g'ri fayl yo'li");
        }
        return target;
    }

    public boolean delete(String publicUrl) {
        if (publicUrl == null || !publicUrl.startsWith(publicUrlPrefix + "/")) {
            return false;
        }
        String relative = publicUrl.substring(publicUrlPrefix.length() + 1);
        try {
            return Files.deleteIfExists(resolveByPublicUrl(relative));
        } catch (IOException e) {
            log.warn("Failed to delete file {}: {}", publicUrl, e.getMessage());
            return false;
        }
    }

    private void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Fayl tanlanmagan");
        }
        if (file.getSize() > MAX_BYTES) {
            throw new BadRequestException("Fayl 10 MB dan oshmasligi kerak");
        }
        String contentType = file.getContentType();
        if (contentType != null && !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException("Faqat rasm fayllari ruxsat etiladi (JPG, PNG, WebP, HEIC)");
        }
        String ext = extractExtension(file.getOriginalFilename());
        if (!ALLOWED_EXTENSIONS.contains(ext.toLowerCase())) {
            throw new BadRequestException("Fayl kengaytmasi noto'g'ri: " + ext);
        }
    }

    private String extractExtension(String filename) {
        if (filename == null) return ".jpg";
        int idx = filename.lastIndexOf('.');
        return idx >= 0 ? filename.substring(idx) : ".jpg";
    }
}
