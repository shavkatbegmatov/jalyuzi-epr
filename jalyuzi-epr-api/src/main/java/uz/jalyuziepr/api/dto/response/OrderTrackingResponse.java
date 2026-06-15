package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.OrderItem;
import uz.jalyuziepr.api.entity.OrderStatusHistory;
import uz.jalyuziepr.api.enums.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Ommaviy ("Jalyuzimni kuzat") buyurtma kuzatuvi uchun javob.
 * MUHIM: bu DTO auth'siz, ommaviy endpoint orqali qaytariladi — shuning uchun
 * faqat mijozga ko'rsatish xavfsiz bo'lgan maydonlar bor. Tannarx (cost),
 * ichki/menejer izohlari, manzil, telefon, ID'lar va xodim huquqlari CHIQARILMAYDI.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrderTrackingResponse {

    /** Mijozga ko'rinadigan soddalashtirilgan bosqichlar soni (treker uchun) */
    public static final int TOTAL_STAGES = 5;

    private String orderNumber;
    private String customerName;

    private String status;        // OrderStatus enum nomi
    private String statusLabel;   // O'zbekcha ko'rinma nomi
    private boolean cancelled;
    private boolean completed;

    private int stageIndex;       // 0..TOTAL_STAGES-1 (bekor qilingan bo'lsa -1)
    private int totalStages;
    private int progressPercent;

    private LocalDateTime createdAt;
    private LocalDateTime measurementDate;
    private LocalDateTime productionStartDate;
    private LocalDateTime productionEndDate;
    private LocalDateTime installationDate;
    private LocalDateTime completedDate;

    private String measurerName;
    private String installerName;

    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;

    private List<Item> items;
    private List<TimelineEntry> timeline;
    private List<String> photosBefore;
    private List<String> photosAfter;

    /** Telegram'da yangiliklarga obuna bo'lish deep-link'i (bot yoqilgan bo'lsa); aks holda null */
    private String telegramSubscribeUrl;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Item {
        private String productName;
        private String roomName;
        private Integer widthMm;
        private Integer heightMm;
        private Integer quantity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TimelineEntry {
        private String status;
        private String statusLabel;
        private LocalDateTime at;
    }

    public static OrderTrackingResponse from(Order o) {
        OrderStatus s = o.getStatus();
        boolean cancelled = s == OrderStatus.BEKOR_QILINDI;
        boolean completed = s == OrderStatus.YAKUNLANDI || s == OrderStatus.QARZGA_OTKAZILDI;
        int stageIndex = cancelled ? -1 : stageIndexOf(s);
        int progress = cancelled ? 0 : Math.round((stageIndex + 1) * 100f / TOTAL_STAGES);

        List<Item> items = o.getItems() == null ? List.of() : o.getItems().stream()
                .map(OrderTrackingResponse::toItem)
                .collect(Collectors.toList());

        List<TimelineEntry> timeline = o.getStatusHistory() == null ? List.of() : o.getStatusHistory().stream()
                .sorted(Comparator.comparing(OrderStatusHistory::getCreatedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(h -> TimelineEntry.builder()
                        .status(h.getToStatus() != null ? h.getToStatus().name() : null)
                        .statusLabel(h.getToStatus() != null ? h.getToStatus().getDisplayName() : null)
                        .at(h.getCreatedAt())
                        // Ataylab: ichki izohlar (h.getNotes()) chiqarilmaydi — menejer izohi bo'lishi mumkin
                        .build())
                .collect(Collectors.toList());

        return OrderTrackingResponse.builder()
                .orderNumber(o.getOrderNumber())
                .customerName(o.getCustomer() != null ? o.getCustomer().getFullName() : null)
                .status(s.name())
                .statusLabel(s.getDisplayName())
                .cancelled(cancelled)
                .completed(completed)
                .stageIndex(stageIndex)
                .totalStages(TOTAL_STAGES)
                .progressPercent(progress)
                .createdAt(o.getCreatedAt())
                .measurementDate(o.getMeasurementDate())
                .productionStartDate(o.getProductionStartDate())
                .productionEndDate(o.getProductionEndDate())
                .installationDate(o.getInstallationDate())
                .completedDate(o.getCompletedDate())
                .measurerName(o.getMeasurer() != null ? o.getMeasurer().getFullName() : null)
                .installerName(o.getInstaller() != null ? o.getInstaller().getFullName() : null)
                .totalAmount(o.getTotalAmount())
                .paidAmount(o.getPaidAmount())
                .remainingAmount(o.getRemainingAmount())
                .items(items)
                .timeline(timeline)
                .photosBefore(o.getPhotosBefore() != null ? List.copyOf(o.getPhotosBefore()) : List.of())
                .photosAfter(o.getPhotosAfter() != null ? List.copyOf(o.getPhotosAfter()) : List.of())
                .build();
    }

    private static Item toItem(OrderItem i) {
        return Item.builder()
                .productName(i.getProduct() != null ? i.getProduct().getName() : null)
                .roomName(i.getRoomName())
                .widthMm(i.getWidthMm())
                .heightMm(i.getHeightMm())
                .quantity(i.getQuantity())
                .build();
    }

    /**
     * 14 ta backend statusni mijozga tushunarli 5 ta bosqichga moslaydi:
     * 0 = Qabul qilindi, 1 = Ishlab chiqarish, 2 = Tayyor, 3 = O'rnatish, 4 = Yakunlandi.
     */
    private static int stageIndexOf(OrderStatus s) {
        return switch (s) {
            case YANGI, OLCHOV_KUTILMOQDA, OLCHOV_BAJARILDI, NARX_TASDIQLANDI -> 0;
            case ZAKLAD_QABUL_QILINDI, ISHLAB_CHIQARISHDA -> 1;
            case TAYYOR, ORNATISHGA_TAYINLANDI -> 2;
            case ORNATISH_JARAYONIDA, ORNATISH_BAJARILDI -> 3;
            case TOLOV_KUTILMOQDA, YAKUNLANDI, QARZGA_OTKAZILDI -> 4;
            case BEKOR_QILINDI -> -1;
        };
    }
}
