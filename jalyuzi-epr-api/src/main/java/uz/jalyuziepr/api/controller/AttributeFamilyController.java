package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.request.AttributeFamilyRequest;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.AttributeFamilyResponse;
import uz.jalyuziepr.api.dto.schema.AttributeDefinition;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;
import uz.jalyuziepr.api.dto.schema.ResolvedAttributeSchema;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.AttributeFamilyService;

import java.util.List;
import java.util.Map;

/**
 * REST controller for the hierarchical attribute family tree.
 */
@RestController
@RequestMapping("/v1/attribute-families")
@RequiredArgsConstructor
@Tag(name = "Attribute Families", description = "Ierarxik atribut oilasi daraxti API")
public class AttributeFamilyController {

    private final AttributeFamilyService familyService;

    @GetMapping("/tree")
    @Operation(summary = "Get full family tree")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_VIEW)
    public ResponseEntity<ApiResponse<List<AttributeFamilyResponse>>> getTree() {
        return ResponseEntity.ok(ApiResponse.success(familyService.getTree()));
    }

    @GetMapping("/leaves")
    @Operation(summary = "Get leaf families (for product creation)")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<List<AttributeFamilyResponse>>> getLeaves() {
        return ResponseEntity.ok(ApiResponse.success(familyService.getLeaves()));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get family node by id")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_VIEW)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getById(id)));
    }

    @GetMapping("/{id}/effective-schema")
    @Operation(summary = "Resolved effective schema (cascade) for a node")
    @RequiresPermission(PermissionCode.PRODUCTS_VIEW)
    public ResponseEntity<ApiResponse<ResolvedAttributeSchema>> getEffectiveSchema(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(familyService.getEffectiveSchema(id)));
    }

    @PostMapping
    @Operation(summary = "Create family node")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_CREATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> create(
            @Valid @RequestBody AttributeFamilyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tugun yaratildi", familyService.create(request)));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update family node")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> update(
            @PathVariable Long id, @Valid @RequestBody AttributeFamilyRequest request) {
        return ResponseEntity.ok(ApiResponse.success("Tugun yangilandi", familyService.update(id, request)));
    }

    @PutMapping("/{id}/move")
    @Operation(summary = "Move node to a new parent")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> move(
            @PathVariable Long id, @RequestParam(required = false) Long parentId) {
        return ResponseEntity.ok(ApiResponse.success("Tugun ko'chirildi", familyService.move(id, parentId)));
    }

    @PutMapping("/{id}/schema")
    @Operation(summary = "Replace own delta schema")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> updateSchema(
            @PathVariable Long id, @Valid @RequestBody AttributeSchema schema) {
        return ResponseEntity.ok(ApiResponse.success("Sxema yangilandi", familyService.updateSchema(id, schema)));
    }

    @PostMapping("/{id}/attributes")
    @Operation(summary = "Add own attribute")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> addAttribute(
            @PathVariable Long id, @Valid @RequestBody AttributeDefinition attribute) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Atribut qo'shildi", familyService.addAttribute(id, attribute)));
    }

    @PutMapping("/{id}/attributes/{key}")
    @Operation(summary = "Update own attribute")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> updateAttribute(
            @PathVariable Long id, @PathVariable String key, @Valid @RequestBody AttributeDefinition attribute) {
        return ResponseEntity.ok(ApiResponse.success("Atribut yangilandi", familyService.updateAttribute(id, key, attribute)));
    }

    @DeleteMapping("/{id}/attributes/{key}")
    @Operation(summary = "Remove own attribute")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> removeAttribute(
            @PathVariable Long id, @PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.success("Atribut o'chirildi", familyService.removeAttribute(id, key)));
    }

    @PutMapping("/{id}/overrides/{key}")
    @Operation(summary = "Set property-level override on an inherited attribute")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> setOverride(
            @PathVariable Long id, @PathVariable String key, @RequestBody Map<String, Object> changedProps) {
        return ResponseEntity.ok(ApiResponse.success("Override saqlandi", familyService.setOverride(id, key, changedProps)));
    }

    @DeleteMapping("/{id}/overrides/{key}")
    @Operation(summary = "Clear override (restore inheritance)")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_UPDATE)
    public ResponseEntity<ApiResponse<AttributeFamilyResponse>> clearOverride(
            @PathVariable Long id, @PathVariable String key) {
        return ResponseEntity.ok(ApiResponse.success("Override olib tashlandi", familyService.clearOverride(id, key)));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete (deactivate) family node")
    @RequiresPermission(PermissionCode.ATTRIBUTE_FAMILIES_DELETE)
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        familyService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Tugun o'chirildi"));
    }
}
