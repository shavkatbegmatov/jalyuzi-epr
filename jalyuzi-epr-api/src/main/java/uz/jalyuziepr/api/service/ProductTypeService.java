package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.ProductTypeRequest;
import uz.jalyuziepr.api.dto.response.ProductTypeResponse;
import uz.jalyuziepr.api.dto.schema.AttributeDefinition;
import uz.jalyuziepr.api.dto.schema.AttributeSchema;
import uz.jalyuziepr.api.entity.ProductType;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.ProductTypeRepository;
import uz.jalyuziepr.api.repository.UserRepository;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing product types and their attribute schemas.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductTypeService {

    private final ProductTypeRepository productTypeRepository;
    private final UserRepository userRepository;

    /**
     * Get all active product types.
     */
    public List<ProductTypeResponse> getAllProductTypes() {
        return productTypeRepository.findByIsActiveTrueOrderByDisplayOrderAsc().stream()
                .map(type -> ProductTypeResponse.from(type,
                        productTypeRepository.countProductsByProductTypeId(type.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Get all product types including inactive ones (for admin).
     */
    public List<ProductTypeResponse> getAllProductTypesAdmin() {
        return productTypeRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(type -> ProductTypeResponse.from(type,
                        productTypeRepository.countProductsByProductTypeId(type.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Get product type by ID.
     */
    public ProductTypeResponse getProductTypeById(Long id) {
        ProductType type = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", id));
        return ProductTypeResponse.from(type,
                productTypeRepository.countProductsByProductTypeId(type.getId()));
    }

    /**
     * Get product type by code.
     */
    public ProductTypeResponse getProductTypeByCode(String code) {
        ProductType type = productTypeRepository.findByCode(code)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "code", code));
        return ProductTypeResponse.from(type,
                productTypeRepository.countProductsByProductTypeId(type.getId()));
    }

    /**
     * Create a new product type.
     */
    @Transactional
    public ProductTypeResponse createProductType(ProductTypeRequest request) {
        // Check for duplicate code
        if (productTypeRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Bu kod allaqachon mavjud: " + request.getCode());
        }

        ProductType type = ProductType.builder()
                .code(request.getCode())
                .name(request.getName())
                .description(request.getDescription())
                .icon(request.getIcon())
                .color(request.getColor())
                .displayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0)
                .defaultUnitType(request.getDefaultUnitType())
                .attributeSchema(request.getAttributeSchema() != null
                        ? request.getAttributeSchema()
                        : new AttributeSchema())
                .isSystem(false)
                .isActive(true)
                .createdBy(getCurrentUser())
                .build();

        type = productTypeRepository.save(type);
        log.info("Created product type: {} ({})", type.getName(), type.getCode());

        return ProductTypeResponse.from(type, 0L);
    }

    /**
     * Update an existing product type.
     */
    @Transactional
    public ProductTypeResponse updateProductType(Long id, ProductTypeRequest request) {
        ProductType type = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", id));

        // Check for duplicate code (if changed)
        if (!type.getCode().equals(request.getCode()) &&
                productTypeRepository.existsByCode(request.getCode())) {
            throw new BadRequestException("Bu kod allaqachon mavjud: " + request.getCode());
        }

        // System types can only update limited fields
        if (Boolean.TRUE.equals(type.getIsSystem())) {
            type.setName(request.getName());
            type.setDescription(request.getDescription());
            type.setIcon(request.getIcon());
            type.setColor(request.getColor());
            type.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : type.getDisplayOrder());
            // Code and schema cannot be changed for system types
        } else {
            type.setCode(request.getCode());
            type.setName(request.getName());
            type.setDescription(request.getDescription());
            type.setIcon(request.getIcon());
            type.setColor(request.getColor());
            type.setDisplayOrder(request.getDisplayOrder() != null ? request.getDisplayOrder() : 0);
            type.setDefaultUnitType(request.getDefaultUnitType());
            if (request.getAttributeSchema() != null) {
                type.setAttributeSchema(request.getAttributeSchema());
            }
        }

        type = productTypeRepository.save(type);
        log.info("Updated product type: {} ({})", type.getName(), type.getCode());

        return ProductTypeResponse.from(type,
                productTypeRepository.countProductsByProductTypeId(type.getId()));
    }

    /**
     * Update only the attribute schema of a product type.
     */
    @Transactional
    public ProductTypeResponse updateAttributeSchema(Long id, AttributeSchema schema) {
        ProductType type = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", id));

        if (Boolean.TRUE.equals(type.getIsSystem())) {
            throw new BadRequestException("Tizimiy mahsulot turining sxemasini o'zgartirish mumkin emas");
        }

        type.setAttributeSchema(schema);
        type = productTypeRepository.save(type);
        log.info("Updated attribute schema for product type: {}", type.getCode());

        return ProductTypeResponse.from(type,
                productTypeRepository.countProductsByProductTypeId(type.getId()));
    }

    /**
     * Add an attribute to a product type's schema.
     */
    @Transactional
    public ProductTypeResponse addAttribute(Long id, AttributeDefinition attribute) {
        ProductType type = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", id));

        if (Boolean.TRUE.equals(type.getIsSystem())) {
            throw new BadRequestException("Tizimiy mahsulot turiga atribut qo'shish mumkin emas");
        }

        AttributeSchema schema = type.getAttributeSchema();
        if (schema == null) {
            schema = new AttributeSchema();
        }

        // Check for duplicate key
        if (schema.findAttribute(attribute.getKey()) != null) {
            throw new BadRequestException("Bu atribut kaliti allaqachon mavjud: " + attribute.getKey());
        }

        // Add the attribute
        if (schema.getAttributes() == null) {
            schema.setAttributes(new ArrayList<>());
        }
        schema.getAttributes().add(attribute);
        type.setAttributeSchema(schema);

        type = productTypeRepository.save(type);
        log.info("Added attribute '{}' to product type: {}", attribute.getKey(), type.getCode());

        return ProductTypeResponse.from(type,
                productTypeRepository.countProductsByProductTypeId(type.getId()));
    }

    /**
     * Update an attribute in a product type's schema.
     */
    @Transactional
    public ProductTypeResponse updateAttribute(Long id, String attributeKey, AttributeDefinition attribute) {
        ProductType type = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", id));

        if (Boolean.TRUE.equals(type.getIsSystem())) {
            throw new BadRequestException("Tizimiy mahsulot turining atributini o'zgartirish mumkin emas");
        }

        AttributeSchema schema = type.getAttributeSchema();
        if (schema == null || schema.getAttributes() == null) {
            throw new BadRequestException("Atribut topilmadi: " + attributeKey);
        }

        // Find and update the attribute
        boolean found = false;
        for (int i = 0; i < schema.getAttributes().size(); i++) {
            if (schema.getAttributes().get(i).getKey().equals(attributeKey)) {
                schema.getAttributes().set(i, attribute);
                found = true;
                break;
            }
        }

        if (!found) {
            throw new BadRequestException("Atribut topilmadi: " + attributeKey);
        }

        type.setAttributeSchema(schema);
        type = productTypeRepository.save(type);
        log.info("Updated attribute '{}' in product type: {}", attributeKey, type.getCode());

        return ProductTypeResponse.from(type,
                productTypeRepository.countProductsByProductTypeId(type.getId()));
    }

    /**
     * Remove an attribute from a product type's schema.
     */
    @Transactional
    public ProductTypeResponse removeAttribute(Long id, String attributeKey) {
        ProductType type = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", id));

        if (Boolean.TRUE.equals(type.getIsSystem())) {
            throw new BadRequestException("Tizimiy mahsulot turidan atributni o'chirish mumkin emas");
        }

        AttributeSchema schema = type.getAttributeSchema();
        if (schema == null || schema.getAttributes() == null) {
            throw new BadRequestException("Atribut topilmadi: " + attributeKey);
        }

        // Remove the attribute
        boolean removed = schema.getAttributes().removeIf(attr -> attr.getKey().equals(attributeKey));
        if (!removed) {
            throw new BadRequestException("Atribut topilmadi: " + attributeKey);
        }

        type.setAttributeSchema(schema);
        type = productTypeRepository.save(type);
        log.info("Removed attribute '{}' from product type: {}", attributeKey, type.getCode());

        return ProductTypeResponse.from(type,
                productTypeRepository.countProductsByProductTypeId(type.getId()));
    }

    /**
     * Delete a product type (soft delete).
     */
    @Transactional
    public void deleteProductType(Long id) {
        ProductType type = productTypeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", id));

        if (Boolean.TRUE.equals(type.getIsSystem())) {
            throw new BadRequestException("Tizimiy mahsulot turini o'chirish mumkin emas");
        }

        // Check if there are products using this type
        long productCount = productTypeRepository.countProductsByProductTypeId(id);
        if (productCount > 0) {
            throw new BadRequestException(
                    String.format("Bu turda %d ta mahsulot mavjud. Avval mahsulotlarni boshqa turga o'tkazing.", productCount));
        }

        type.setIsActive(false);
        productTypeRepository.save(type);
        log.info("Deleted (deactivated) product type: {} ({})", type.getName(), type.getCode());
    }

    /**
     * Get current authenticated user.
     */
    private User getCurrentUser() {
        try {
            String username = SecurityContextHolder.getContext().getAuthentication().getName();
            return userRepository.findByUsername(username).orElse(null);
        } catch (Exception e) {
            return null;
        }
    }
}
