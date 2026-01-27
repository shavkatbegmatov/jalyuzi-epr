package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.annotation.ExportColumn;
import uz.jalyuziepr.api.annotation.ExportColumn.ColumnType;
import uz.jalyuziepr.api.annotation.ExportEntity;
import uz.jalyuziepr.api.entity.Product;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ExportEntity(
    sheetName = "Mahsulotlar",
    title = "Jalyuzi Mahsulotlari Hisoboti",
    orientation = ExportEntity.Orientation.LANDSCAPE
)
public class ProductResponse {
    @ExportColumn(header = "ID", order = 1, type = ColumnType.NUMBER)
    private Long id;

    @ExportColumn(header = "SKU", order = 2)
    private String sku;

    @ExportColumn(header = "Nomi", order = 3)
    private String name;

    @ExportColumn(header = "Brend", order = 4)
    private String brandName;

    private Long brandId;

    @ExportColumn(header = "Kategoriya", order = 5)
    private String categoryName;

    private Long categoryId;

    // Jalyuzi xususiyatlari
    @ExportColumn(header = "Turi", order = 6, type = ColumnType.ENUM)
    private BlindType blindType;

    @ExportColumn(header = "Material", order = 7, type = ColumnType.ENUM)
    private BlindMaterial material;

    @ExportColumn(header = "Rang", order = 8)
    private String color;

    @ExportColumn(header = "Boshqaruv", order = 9, type = ColumnType.ENUM)
    private ControlType controlType;

    // O'lcham cheklovlari
    @ExportColumn(header = "Min kenglik", order = 10, type = ColumnType.NUMBER)
    private Integer minWidth;

    @ExportColumn(header = "Max kenglik", order = 11, type = ColumnType.NUMBER)
    private Integer maxWidth;

    @ExportColumn(header = "Min balandlik", order = 12, type = ColumnType.NUMBER)
    private Integer minHeight;

    @ExportColumn(header = "Max balandlik", order = 13, type = ColumnType.NUMBER)
    private Integer maxHeight;

    @ExportColumn(header = "O'lcham diapazoni", order = 14)
    private String sizeRangeString;

    // Narxlar
    @ExportColumn(header = "Xarid narxi", order = 15, type = ColumnType.CURRENCY)
    private BigDecimal purchasePrice;

    @ExportColumn(header = "Sotuv narxi", order = 16, type = ColumnType.CURRENCY)
    private BigDecimal sellingPrice;

    @ExportColumn(header = "Narx/m²", order = 17, type = ColumnType.CURRENCY)
    private BigDecimal pricePerSquareMeter;

    @ExportColumn(header = "O'rnatish narxi", order = 18, type = ColumnType.CURRENCY)
    private BigDecimal installationPrice;

    @ExportColumn(header = "Miqdor", order = 19, type = ColumnType.NUMBER)
    private Integer quantity;

    @ExportColumn(header = "Minimal zaxira", order = 20, type = ColumnType.NUMBER)
    private Integer minStockLevel;

    @ExportColumn(header = "Kam zaxira", order = 21, type = ColumnType.BOOLEAN)
    private boolean lowStock;

    private String description;
    private String imageUrl;

    @ExportColumn(header = "Faol", order = 22, type = ColumnType.BOOLEAN)
    private Boolean active;

    public static ProductResponse from(Product product) {
        return ProductResponse.builder()
                .id(product.getId())
                .sku(product.getSku())
                .name(product.getName())
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .blindType(product.getBlindType())
                .material(product.getMaterial())
                .color(product.getColor())
                .controlType(product.getControlType())
                .minWidth(product.getMinWidth())
                .maxWidth(product.getMaxWidth())
                .minHeight(product.getMinHeight())
                .maxHeight(product.getMaxHeight())
                .sizeRangeString(product.getSizeRangeString())
                .purchasePrice(product.getPurchasePrice())
                .sellingPrice(product.getSellingPrice())
                .pricePerSquareMeter(product.getPricePerSquareMeter())
                .installationPrice(product.getInstallationPrice())
                .quantity(product.getQuantity())
                .minStockLevel(product.getMinStockLevel())
                .lowStock(product.getQuantity() <= product.getMinStockLevel())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .active(product.getActive())
                .build();
    }
}
