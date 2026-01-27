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
import uz.jalyuziepr.api.enums.ProductType;
import uz.jalyuziepr.api.enums.UnitType;

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

    // Mahsulot turi va o'lchov birligi
    @ExportColumn(header = "Mahsulot turi", order = 6, type = ColumnType.ENUM)
    private ProductType productType;

    @ExportColumn(header = "O'lchov birligi", order = 7, type = ColumnType.ENUM)
    private UnitType unitType;

    // Jalyuzi xususiyatlari (FINISHED_PRODUCT uchun)
    @ExportColumn(header = "Jalyuzi turi", order = 8, type = ColumnType.ENUM)
    private BlindType blindType;

    @ExportColumn(header = "Material", order = 9, type = ColumnType.ENUM)
    private BlindMaterial material;

    @ExportColumn(header = "Rang", order = 10)
    private String color;

    @ExportColumn(header = "Boshqaruv", order = 11, type = ColumnType.ENUM)
    private ControlType controlType;

    // O'lcham cheklovlari (FINISHED_PRODUCT uchun)
    @ExportColumn(header = "Min kenglik", order = 12, type = ColumnType.NUMBER)
    private Integer minWidth;

    @ExportColumn(header = "Max kenglik", order = 13, type = ColumnType.NUMBER)
    private Integer maxWidth;

    @ExportColumn(header = "Min balandlik", order = 14, type = ColumnType.NUMBER)
    private Integer minHeight;

    @ExportColumn(header = "Max balandlik", order = 15, type = ColumnType.NUMBER)
    private Integer maxHeight;

    @ExportColumn(header = "O'lcham diapazoni", order = 16)
    private String sizeRangeString;

    // Narxlar
    @ExportColumn(header = "Xarid narxi", order = 17, type = ColumnType.CURRENCY)
    private BigDecimal purchasePrice;

    @ExportColumn(header = "Sotuv narxi", order = 18, type = ColumnType.CURRENCY)
    private BigDecimal sellingPrice;

    @ExportColumn(header = "Narx/m²", order = 19, type = ColumnType.CURRENCY)
    private BigDecimal pricePerSquareMeter;

    @ExportColumn(header = "O'rnatish narxi", order = 20, type = ColumnType.CURRENCY)
    private BigDecimal installationPrice;

    @ExportColumn(header = "Miqdor", order = 21, type = ColumnType.NUMBER)
    private BigDecimal quantity;

    @ExportColumn(header = "Minimal zaxira", order = 22, type = ColumnType.NUMBER)
    private BigDecimal minStockLevel;

    @ExportColumn(header = "Kam zaxira", order = 23, type = ColumnType.BOOLEAN)
    private boolean lowStock;

    // Xomashyo uchun maydonlar (RAW_MATERIAL)
    @ExportColumn(header = "Rulon kengligi (m)", order = 24, type = ColumnType.NUMBER)
    private BigDecimal rollWidth;

    @ExportColumn(header = "Rulon uzunligi (m)", order = 25, type = ColumnType.NUMBER)
    private BigDecimal rollLength;

    @ExportColumn(header = "Profil uzunligi (m)", order = 26, type = ColumnType.NUMBER)
    private BigDecimal profileLength;

    @ExportColumn(header = "Birlik og'irligi (kg)", order = 27, type = ColumnType.NUMBER)
    private BigDecimal weightPerUnit;

    // Aksessuar uchun maydonlar (ACCESSORY)
    @ExportColumn(header = "Mos jalyuzi turlari", order = 28)
    private String compatibleBlindTypes;

    private String description;
    private String imageUrl;

    @ExportColumn(header = "Faol", order = 29, type = ColumnType.BOOLEAN)
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
                .productType(product.getProductType())
                .unitType(product.getUnitType())
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
                .lowStock(product.getQuantity().compareTo(product.getMinStockLevel()) <= 0)
                .rollWidth(product.getRollWidth())
                .rollLength(product.getRollLength())
                .profileLength(product.getProfileLength())
                .weightPerUnit(product.getWeightPerUnit())
                .compatibleBlindTypes(product.getCompatibleBlindTypes())
                .description(product.getDescription())
                .imageUrl(product.getImageUrl())
                .active(product.getActive())
                .build();
    }
}
