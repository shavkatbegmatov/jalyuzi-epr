package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.ProductRequest;
import uz.jalyuziepr.api.dto.response.PriceCalculationResponse;
import uz.jalyuziepr.api.dto.response.ProductResponse;
import uz.jalyuziepr.api.entity.Brand;
import uz.jalyuziepr.api.entity.Category;
import uz.jalyuziepr.api.entity.Product;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;
import uz.jalyuziepr.api.enums.ProductType;
import uz.jalyuziepr.api.enums.UnitType;
import uz.jalyuziepr.api.dto.schema.ResolvedAttributeSchema;
import uz.jalyuziepr.api.entity.AttributeFamily;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.AttributeFamilyRepository;
import uz.jalyuziepr.api.repository.BrandRepository;
import uz.jalyuziepr.api.repository.CategoryRepository;
import uz.jalyuziepr.api.repository.ProductRepository;
import uz.jalyuziepr.api.repository.ProductTypeRepository;
import uz.jalyuziepr.api.repository.UserRepository;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ProductTypeRepository productTypeRepository;
    private final AttributeFamilyRepository attributeFamilyRepository;
    private final AttributeSchemaResolver schemaResolver;
    private final AttributeValueValidator attributeValueValidator;

    public Page<ProductResponse> getAllProducts(Pageable pageable) {
        return productRepository.findByActiveTrue(pageable)
                .map(ProductResponse::from);
    }

    public Page<ProductResponse> searchProducts(String search, Pageable pageable) {
        return productRepository.searchProducts(search, pageable)
                .map(ProductResponse::from);
    }

    public Page<ProductResponse> getProductsWithFilters(
            Long brandId, Long categoryId, BlindType blindType,
            BlindMaterial material, ControlType controlType,
            ProductType productType, String search, Pageable pageable) {
        return productRepository.findWithFilters(brandId, categoryId, blindType, material, controlType, productType, search, pageable)
                .map(ProductResponse::from);
    }

    public ProductResponse getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", id));
        return ProductResponse.from(product);
    }

    public ProductResponse getProductBySku(String sku) {
        Product product = productRepository.findBySku(sku)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "sku", sku));
        return ProductResponse.from(product);
    }

    @Transactional
    public ProductResponse createProduct(ProductRequest request) {
        if (productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Bu SKU allaqachon mavjud: " + request.getSku());
        }

        Product product = new Product();
        mapRequestToProduct(request, product);
        product.setCreatedBy(getCurrentUser());

        Product savedProduct = productRepository.save(product);
        return ProductResponse.from(savedProduct);
    }

    @Transactional
    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", id));

        if (!product.getSku().equals(request.getSku()) &&
                productRepository.existsBySku(request.getSku())) {
            throw new BadRequestException("Bu SKU allaqachon mavjud: " + request.getSku());
        }

        mapRequestToProduct(request, product);
        Product savedProduct = productRepository.save(product);
        return ProductResponse.from(savedProduct);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", id));
        product.setActive(false);
        productRepository.save(product);
    }

    public List<ProductResponse> getLowStockProducts() {
        return productRepository.findLowStockProducts().stream()
                .map(ProductResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public ProductResponse adjustStock(Long id, BigDecimal adjustment) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", id));

        BigDecimal newQuantity = product.getQuantity().add(adjustment);
        if (newQuantity.compareTo(BigDecimal.ZERO) < 0) {
            throw new BadRequestException("Zaxira manfiy bo'lishi mumkin emas");
        }

        product.setQuantity(newQuantity);
        return ProductResponse.from(productRepository.save(product));
    }

    /**
     * Jalyuzi narxini hisoblash (o'lcham bo'yicha)
     */
    public PriceCalculationResponse calculatePrice(Long productId, Integer width, Integer height, Boolean includeInstallation) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", productId));

        PriceCalculationResponse.PriceCalculationResponseBuilder builder = PriceCalculationResponse.builder()
                .productId(productId)
                .productName(product.getName())
                .width(width)
                .height(height)
                .pricePerSquareMeter(product.getPricePerSquareMeter())
                .basePrice(product.getSellingPrice());

        // O'lcham validatsiyasi
        boolean validSize = validateSize(product, width, height);
        builder.validSize(validSize);

        if (!validSize) {
            builder.validationMessage(String.format(
                    "O'lcham noto'g'ri. Ruxsat etilgan: %d-%d x %d-%d mm",
                    product.getMinWidth(), product.getMaxWidth(),
                    product.getMinHeight(), product.getMaxHeight()
            ));
            return builder.build();
        }

        // Kvadrat metr hisoblash
        BigDecimal sqm = BigDecimal.valueOf(width)
                .multiply(BigDecimal.valueOf(height))
                .divide(BigDecimal.valueOf(1_000_000), 4, RoundingMode.HALF_UP);
        builder.squareMeters(sqm);

        // Mahsulot narxini hisoblash
        BigDecimal productPrice;
        if (product.getPricePerSquareMeter() != null && product.getPricePerSquareMeter().compareTo(BigDecimal.ZERO) > 0) {
            productPrice = product.getPricePerSquareMeter().multiply(sqm).setScale(2, RoundingMode.HALF_UP);
        } else {
            productPrice = product.getSellingPrice();
        }
        builder.productPrice(productPrice);

        // O'rnatish narxi
        BigDecimal installationPrice = BigDecimal.ZERO;
        if (Boolean.TRUE.equals(includeInstallation) && product.getInstallationPrice() != null) {
            installationPrice = product.getInstallationPrice();
        }
        builder.installationPrice(installationPrice);

        // Jami narx
        builder.totalPrice(productPrice.add(installationPrice));

        return builder.build();
    }

    private boolean validateSize(Product product, Integer width, Integer height) {
        if (width == null || height == null) {
            return false;
        }

        boolean widthValid = (product.getMinWidth() == null || width >= product.getMinWidth()) &&
                           (product.getMaxWidth() == null || width <= product.getMaxWidth());
        boolean heightValid = (product.getMinHeight() == null || height >= product.getMinHeight()) &&
                            (product.getMaxHeight() == null || height <= product.getMaxHeight());

        return widthValid && heightValid;
    }

    private void mapRequestToProduct(ProductRequest request, Product product) {
        product.setSku(request.getSku());
        product.setName(request.getName());

        // Mahsulot turi va o'lchov birligi
        product.setProductType(request.getProductType() != null ? request.getProductType() : ProductType.FINISHED_PRODUCT);
        product.setUnitType(request.getUnitType() != null ? request.getUnitType() : UnitType.PIECE);

        // Jalyuzi xususiyatlari (FINISHED_PRODUCT uchun)
        product.setBlindType(request.getBlindType());
        product.setMaterial(request.getMaterial());
        product.setColor(request.getColor());
        product.setControlType(request.getControlType());

        // O'lcham cheklovlari (FINISHED_PRODUCT uchun)
        product.setMinWidth(request.getMinWidth());
        product.setMaxWidth(request.getMaxWidth());
        product.setMinHeight(request.getMinHeight());
        product.setMaxHeight(request.getMaxHeight());

        // Narxlar
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setPricePerSquareMeter(request.getPricePerSquareMeter());
        product.setInstallationPrice(request.getInstallationPrice());

        product.setQuantity(request.getQuantity() != null ? request.getQuantity() : BigDecimal.ZERO);
        product.setMinStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : new BigDecimal("5"));
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());

        // Xomashyo uchun maydonlar (RAW_MATERIAL)
        product.setRollWidth(request.getRollWidth());
        product.setRollLength(request.getRollLength());
        product.setProfileLength(request.getProfileLength());
        product.setWeightPerUnit(request.getWeightPerUnit());

        // Aksessuar uchun maydonlar (ACCESSORY)
        product.setCompatibleBlindTypes(request.getCompatibleBlindTypes());

        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new ResourceNotFoundException("Brend", "id", request.getBrandId()));
            product.setBrand(brand);
        } else {
            product.setBrand(null);
        }

        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Kategoriya", "id", request.getCategoryId()));
            product.setCategory(category);
        } else {
            product.setCategory(null);
        }

        // Dinamik atributlar (JSONB) — har doim saqlanadi
        product.setCustomAttributes(request.getCustomAttributes() != null
                ? request.getCustomAttributes() : new HashMap<>());

        // Eski mahsulot turi entity bog'lanishi (V24 tizimi)
        if (request.getProductTypeId() != null) {
            uz.jalyuziepr.api.entity.ProductType pt = productTypeRepository.findById(request.getProductTypeId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mahsulot turi", "id", request.getProductTypeId()));
            product.setProductTypeEntity(pt);
        }

        // Ierarxik atribut oilasi (V40) — leaf tekshiruvi + effective validatsiya + back-compat
        applyAttributeFamily(request, product);
    }

    /**
     * Resolve the chosen attribute family, enforce leaf-only, validate custom
     * attribute values against the effective (cascade) schema, and bridge the
     * legacy product_type_id from the nearest ancestor that maps to a ProductType.
     */
    private void applyAttributeFamily(ProductRequest request, Product product) {
        if (request.getAttributeFamilyId() == null) {
            return; // legacy path (ProductType-only) — unchanged behaviour
        }
        AttributeFamily family = attributeFamilyRepository.findById(request.getAttributeFamilyId())
                .orElseThrow(() -> new ResourceNotFoundException("Atribut oilasi", "id", request.getAttributeFamilyId()));
        if (Boolean.FALSE.equals(family.getIsActive())) {
            throw new BadRequestException("Tanlangan atribut oilasi faol emas");
        }
        if (!attributeFamilyRepository.isLeaf(family.getId())) {
            throw new BadRequestException("Mahsulot faqat daraxtning eng quyi (barg) tugunida yaratiladi. Iltimos aniqroq turni tanlang.");
        }

        ResolvedAttributeSchema effective = schemaResolver.resolveEffective(family);
        attributeValueValidator.validate(effective, request.getCustomAttributes());

        product.setAttributeFamily(family);

        // Back-compat: product_type_id ni eng yaqin bog'langan ajdoddan to'ldiramiz
        uz.jalyuziepr.api.entity.ProductType bridged = resolveFamilyProductType(family);
        if (bridged != null) {
            product.setProductTypeEntity(bridged);
        }
    }

    private uz.jalyuziepr.api.entity.ProductType resolveFamilyProductType(AttributeFamily family) {
        AttributeFamily cur = family;
        int guard = 0;
        while (cur != null && guard++ < 32) {
            if (cur.getProductType() != null) {
                return cur.getProductType();
            }
            cur = cur.getParent();
        }
        return null;
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", userDetails.getId()));
    }
}
