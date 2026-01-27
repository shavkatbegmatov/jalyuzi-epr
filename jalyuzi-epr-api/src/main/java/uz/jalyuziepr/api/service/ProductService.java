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
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.BrandRepository;
import uz.jalyuziepr.api.repository.CategoryRepository;
import uz.jalyuziepr.api.repository.ProductRepository;
import uz.jalyuziepr.api.repository.UserRepository;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final BrandRepository brandRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

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
            String search, Pageable pageable) {
        return productRepository.findWithFilters(brandId, categoryId, blindType, material, controlType, search, pageable)
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
    public ProductResponse adjustStock(Long id, int adjustment) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", id));

        int newQuantity = product.getQuantity() + adjustment;
        if (newQuantity < 0) {
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

        // Jalyuzi xususiyatlari
        product.setBlindType(request.getBlindType());
        product.setMaterial(request.getMaterial());
        product.setColor(request.getColor());
        product.setControlType(request.getControlType());

        // O'lcham cheklovlari
        product.setMinWidth(request.getMinWidth());
        product.setMaxWidth(request.getMaxWidth());
        product.setMinHeight(request.getMinHeight());
        product.setMaxHeight(request.getMaxHeight());

        // Narxlar
        product.setPurchasePrice(request.getPurchasePrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setPricePerSquareMeter(request.getPricePerSquareMeter());
        product.setInstallationPrice(request.getInstallationPrice());

        product.setQuantity(request.getQuantity() != null ? request.getQuantity() : 0);
        product.setMinStockLevel(request.getMinStockLevel() != null ? request.getMinStockLevel() : 5);
        product.setDescription(request.getDescription());
        product.setImageUrl(request.getImageUrl());

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
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", userDetails.getId()));
    }
}
