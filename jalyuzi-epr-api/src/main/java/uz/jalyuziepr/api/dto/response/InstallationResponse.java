package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.annotation.ExportColumn;
import uz.jalyuziepr.api.annotation.ExportColumn.ColumnType;
import uz.jalyuziepr.api.annotation.ExportEntity;
import uz.jalyuziepr.api.entity.Installation;
import uz.jalyuziepr.api.enums.InstallationStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ExportEntity(
    sheetName = "O'rnatishlar",
    title = "O'rnatishlar Hisoboti",
    orientation = ExportEntity.Orientation.LANDSCAPE
)
public class InstallationResponse {

    @ExportColumn(header = "ID", order = 1, type = ColumnType.NUMBER)
    private Long id;

    private Long saleId;

    @ExportColumn(header = "Faktura", order = 2)
    private String invoiceNumber;

    private Long technicianId;

    @ExportColumn(header = "Texnik", order = 3)
    private String technicianName;

    @ExportColumn(header = "Mijoz", order = 4)
    private String customerName;

    @ExportColumn(header = "Telefon", order = 5)
    private String customerPhone;

    @ExportColumn(header = "Rejalashtirilgan sana", order = 6, type = ColumnType.DATE)
    private LocalDate scheduledDate;

    @ExportColumn(header = "Boshlanish vaqti", order = 7)
    private LocalTime scheduledTimeStart;

    @ExportColumn(header = "Tugash vaqti", order = 8)
    private LocalTime scheduledTimeEnd;

    private LocalDate actualDate;
    private LocalTime actualTimeStart;
    private LocalTime actualTimeEnd;

    @ExportColumn(header = "Status", order = 9, type = ColumnType.ENUM)
    private InstallationStatus status;

    @ExportColumn(header = "Manzil", order = 10)
    private String address;

    private String contactPhone;
    private String accessInstructions;
    private String notes;
    private String completionNotes;
    private String customerSignature;
    private String photosBefore;
    private String photosAfter;

    private LocalDateTime createdAt;
    private String createdByName;

    public static InstallationResponse from(Installation installation) {
        InstallationResponseBuilder builder = InstallationResponse.builder()
                .id(installation.getId())
                .scheduledDate(installation.getScheduledDate())
                .scheduledTimeStart(installation.getScheduledTimeStart())
                .scheduledTimeEnd(installation.getScheduledTimeEnd())
                .actualDate(installation.getActualDate())
                .actualTimeStart(installation.getActualTimeStart())
                .actualTimeEnd(installation.getActualTimeEnd())
                .status(installation.getStatus())
                .address(installation.getAddress())
                .contactPhone(installation.getContactPhone())
                .accessInstructions(installation.getAccessInstructions())
                .notes(installation.getNotes())
                .completionNotes(installation.getCompletionNotes())
                .customerSignature(installation.getCustomerSignature())
                .photosBefore(installation.getPhotosBefore())
                .photosAfter(installation.getPhotosAfter())
                .createdAt(installation.getCreatedAt());

        if (installation.getSale() != null) {
            builder.saleId(installation.getSale().getId())
                    .invoiceNumber(installation.getSale().getInvoiceNumber());
            if (installation.getSale().getCustomer() != null) {
                builder.customerName(installation.getSale().getCustomer().getFullName())
                        .customerPhone(installation.getSale().getCustomer().getPhone());
            }
        }

        if (installation.getTechnician() != null) {
            builder.technicianId(installation.getTechnician().getId())
                    .technicianName(installation.getTechnician().getFullName());
        }

        if (installation.getCreatedBy() != null) {
            builder.createdByName(installation.getCreatedBy().getFullName());
        }

        return builder.build();
    }
}
