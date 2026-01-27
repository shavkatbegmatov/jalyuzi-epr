package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.ProductTypeRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.ProductTypeResponse;
import uz.jalyuziepr.api.dto.schema.AttributeDefinition;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.ProductTypeService;

import java.util.List;

/**
 * REST controller for managing product types.
 * Product types define the structure and custom attributes for products.
 */
@RestController
@RequestMapping("/v1/product-types")
@RequiredArgsConstructor
@Tag(name = "Product Types", description = "Mahsulot turlari konstruktori API")
public class ProductTypeController {

    private final ProductTypeService productTypeService;

    @GetMapping
    @Operation(summary = "Get all product types", description = "Barcha faol mahsulot turlarini olish")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<List<ProductTypeResponse>>> getAllProductTypes() {
        return ResponseEntity.ok(ApiResponse.success(productTypeService.getAllProductTypes()));
    }

    @GetMapping("/admin")
    @Operation(summary = "Get all product types (admin)", description = "Barcha mahsulot turlarini olish (nofaol ham)")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_VIEW)
    public ResponseEntity<ApiResponse<List<ProductTypeResponse>>> getAllProductTypesAdmin() {
        return ResponseEntity.ok(ApiResponse.success(productTypeService.getAllProductTypesAdmin()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get product type by ID", description = "ID bo'yicha mahsulot turini olish")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> getProductTypeById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(productTypeService.getProductTypeById(id)));
    }

    @GetMapping("/code/{code}")
    @Operation(summary = "Get product type by code", description = "Kod bo'yicha mahsulot turini olish")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> getProductTypeByCode(@PathVariable String code) {
        return ResponseEntity.ok(ApiResponse.success(productTypeService.getProductTypeByCode(code)));
    }

    @PostMapping
    @Operation(summary = "Create product type", description = "Yangi mahsulot turi yaratish")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_CREATE)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> createProductType(
            @Valid @RequestBody ProductTypeRequest request) {
        ProductTypeResponse response = productTypeService.createProductType(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Mahsulot turi yaratildi", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update product type", description = "Mahsulot turini yangilash")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_UPDATE)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> updateProductType(
            @PathVariable Long id,
            @Valid @RequestBody ProductTypeRequest request) {
        ProductTypeResponse response = productTypeService.updateProductType(id, request);
        return ResponseEntity.ok(ApiResponse.success("Mahsulot turi yangilandi", response));
    }

    @PutMapping("/{id}/schema")
    @Operation(summary = "Update attribute schema", description = "Atribut sxemasini yangilash")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_UPDATE)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> updateAttributeSchema(
            @PathVariable Long id,
            @Valid @RequestBody AttributeSchema schema) {
        ProductTypeResponse response = productTypeService.updateAttributeSchema(id, schema);
        return ResponseEntity.ok(ApiResponse.success("Atribut sxemasi yangilandi", response));
    }

    @PostMapping("/{id}/attributes")
    @Operation(summary = "Add attribute", description = "Mahsulot turiga atribut qo'shish")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_UPDATE)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> addAttribute(
            @PathVariable Long id,
            @Valid @RequestBody AttributeDefinition attribute) {
        ProductTypeResponse response = productTypeService.addAttribute(id, attribute);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Atribut qo'shildi", response));
    }

    @PutMapping("/{id}/attributes/{key}")
    @Operation(summary = "Update attribute", description = "Atributni yangilash")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_UPDATE)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> updateAttribute(
            @PathVariable Long id,
            @PathVariable String key,
            @Valid @RequestBody AttributeDefinition attribute) {
        ProductTypeResponse response = productTypeService.updateAttribute(id, key, attribute);
        return ResponseEntity.ok(ApiResponse.success("Atribut yangilandi", response));
    }

    @DeleteMapping("/{id}/attributes/{key}")
    @Operation(summary = "Remove attribute", description = "Atributni o'chirish")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_UPDATE)
    public ResponseEntity<ApiResponse<ProductTypeResponse>> removeAttribute(
            @PathVariable Long id,
            @PathVariable String key) {
        ProductTypeResponse response = productTypeService.removeAttribute(id, key);
        return ResponseEntity.ok(ApiResponse.success("Atribut o'chirildi", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete product type", description = "Mahsulot turini o'chirish")
    @RequiresPermission(PermissionCode.PRODUCT_TYPES_DELETE)
    public ResponseEntity<ApiResponse<Void>> deleteProductType(@PathVariable Long id) {
        productTypeService.deleteProductType(id);
        return ResponseEntity.ok(ApiResponse.success("Mahsulot turi o'chirildi"));
    }
}
