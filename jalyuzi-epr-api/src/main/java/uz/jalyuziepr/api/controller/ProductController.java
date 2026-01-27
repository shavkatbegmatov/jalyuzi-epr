package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.ProductRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.PagedResponse;
import uz.jalyuziepr.api.dto.response.PriceCalculationResponse;
import uz.jalyuziepr.api.dto.response.ProductResponse;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.ProductService;
import uz.jalyuziepr.api.service.export.GenericExportService;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Jalyuzi mahsulotlari API")
public class ProductController {

    private final ProductService productService;
    private final GenericExportService genericExportService;

    @GetMapping
    @Operation(summary = "Get all products", description = "Barcha mahsulotlarni olish")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<PagedResponse<ProductResponse>>> getAllProducts(
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BlindType blindType,
            @RequestParam(required = false) BlindMaterial material,
            @RequestParam(required = false) ControlType controlType,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20) Pageable pageable) {

        Page<ProductResponse> products = productService.getProductsWithFilters(
                brandId, categoryId, blindType, material, controlType, search, pageable);

        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(products)));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product by ID", description = "ID bo'yicha mahsulotni olish")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<ProductResponse>> getProductById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductById(id)));
    }

    @GetMapping("/sku/{sku}")
    @Operation(summary = "Get product by SKU", description = "SKU bo'yicha mahsulotni olish")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<ProductResponse>> getProductBySku(@PathVariable String sku) {
        return ResponseEntity.ok(ApiResponse.success(productService.getProductBySku(sku)));
    }

    @GetMapping("/low-stock")
    @Operation(summary = "Get low stock products", description = "Kam zaxiradagi mahsulotlar")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getLowStockProducts() {
        return ResponseEntity.ok(ApiResponse.success(productService.getLowStockProducts()));
    }

    @GetMapping("/{id}/calculate-price")
    @Operation(summary = "Calculate price", description = "O'lcham bo'yicha narx hisoblash")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<PriceCalculationResponse>> calculatePrice(
            @PathVariable Long id,
            @RequestParam Integer width,
            @RequestParam Integer height,
            @RequestParam(defaultValue = "false") Boolean includeInstallation) {
        PriceCalculationResponse result = productService.calculatePrice(id, width, height, includeInstallation);
        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @PostMapping
    @Operation(summary = "Create product", description = "Yangi mahsulot yaratish")
    @RequiresPermission(PermissionCode.PRODUCTS_CREATE)
    public ResponseEntity<ApiResponse<ProductResponse>> createProduct(
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mahsulot yaratildi", product));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product", description = "Mahsulotni yangilash")
    @RequiresPermission(PermissionCode.PRODUCTS_UPDATE)
    public ResponseEntity<ApiResponse<ProductResponse>> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRequest request) {
        ProductResponse product = productService.updateProduct(id, request);
        return ResponseEntity.ok(ApiResponse.success("Mahsulot yangilandi", product));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product", description = "Mahsulotni o'chirish")
    @RequiresPermission(PermissionCode.PRODUCTS_DELETE)
    public ResponseEntity<ApiResponse<Void>> deleteProduct(@PathVariable Long id) {
        productService.deleteProduct(id);
        return ResponseEntity.ok(ApiResponse.success("Mahsulot o'chirildi"));
    }

    @PatchMapping("/{id}/stock")
    @Operation(summary = "Adjust stock", description = "Zaxirani sozlash")
    @RequiresPermission(PermissionCode.PRODUCTS_UPDATE)
    public ResponseEntity<ApiResponse<ProductResponse>> adjustStock(
            @PathVariable Long id,
            @RequestParam int adjustment) {
        ProductResponse product = productService.adjustStock(id, adjustment);
        return ResponseEntity.ok(ApiResponse.success("Zaxira yangilandi", product));
    }

    @GetMapping("/export")
    @Operation(summary = "Export products", description = "Mahsulotlarni eksport qilish")
    @RequiresPermission(PermissionCode.REPORTS_EXPORT)
    public ResponseEntity<Resource> exportProducts(
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) BlindType blindType,
            @RequestParam(required = false) BlindMaterial material,
            @RequestParam(required = false) ControlType controlType,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "excel") String format,
            @RequestParam(defaultValue = "10000") int maxRecords
    ) {
        try {
            Pageable pageable = PageRequest.of(0, maxRecords);
            Page<ProductResponse> page = productService.getProductsWithFilters(
                    brandId, categoryId, blindType, material, controlType, search, pageable);

            ByteArrayOutputStream output = genericExportService.export(
                    page.getContent(),
                    ProductResponse.class,
                    GenericExportService.ExportFormat.valueOf(format.toUpperCase()),
                    "Jalyuzi Mahsulotlari Hisoboti"
            );

            String extension = format.equalsIgnoreCase("excel") ? "xlsx" : "pdf";
            String contentType = format.equalsIgnoreCase("excel")
                    ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    : "application/pdf";
            String filename = "products_" + LocalDate.now() + "." + extension;

            ByteArrayResource resource = new ByteArrayResource(output.toByteArray());

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(resource.contentLength())
                    .body(resource);

        } catch (Exception e) {
            throw new RuntimeException("Eksport qilishda xatolik: " + e.getMessage(), e);
        }
    }
}
