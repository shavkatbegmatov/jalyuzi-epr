package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.shop.*;
import uz.jalyuziepr.api.entity.*;
import uz.jalyuziepr.api.enums.*;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.*;
import uz.jalyuziepr.api.security.JwtTokenProvider;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Internet-do'kon xizmati
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final CustomerRepository customerRepository;
    private final SaleRepository saleRepository;
    private final SmsService smsService;
    private final JwtTokenProvider jwtTokenProvider;

    // ==================== KATALOG ====================

    /**
     * Mahsulotlar katalogi (pagination + filter)
     */
    public Page<ShopProductResponse> getProducts(ShopProductFilter filter, Pageable pageable) {
        // Saralashni sozlash
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if (filter.getSortBy() != null) {
            Sort.Direction direction = "desc".equalsIgnoreCase(filter.getSortDirection())
                    ? Sort.Direction.DESC : Sort.Direction.ASC;
            sort = switch (filter.getSortBy()) {
                case "price" -> Sort.by(direction, "sellingPrice");
                case "name" -> Sort.by(direction, "name");
                case "newest" -> Sort.by(direction, "createdAt");
                default -> sort;
            };
        }

        Pageable sortedPageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);

        // Birinchi blind type bo'lsa, shu bo'yicha filter
        BlindType blindType = filter.getBlindTypes() != null && !filter.getBlindTypes().isEmpty()
                ? filter.getBlindTypes().get(0) : null;

        BlindMaterial material = filter.getMaterials() != null && !filter.getMaterials().isEmpty()
                ? filter.getMaterials().get(0) : null;

        ControlType controlType = filter.getControlTypes() != null && !filter.getControlTypes().isEmpty()
                ? filter.getControlTypes().get(0) : null;

        Page<Product> products = productRepository.findWithFilters(
                filter.getBrandId(),
                filter.getCategoryId(),
                blindType,
                material,
                controlType,
                ProductType.FINISHED_PRODUCT, // Faqat tayyor mahsulotlar
                filter.getSearch(),
                sortedPageable
        );

        return products.map(ShopProductResponse::from);
    }

    /**
     * Mahsulot detail
     */
    public ShopProductResponse getProduct(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", id));

        if (!product.getActive()) {
            throw new ResourceNotFoundException("Mahsulot", "id", id);
        }

        return ShopProductResponse.from(product);
    }

    /**
     * Kategoriyalar ro'yxati
     */
    public List<ShopCategoryResponse> getCategories() {
        return categoryRepository.findAll().stream()
                .map(category -> {
                    long count = productRepository.findByCategoryIdAndActiveTrue(category.getId()).size();
                    return ShopCategoryResponse.from(category, count);
                })
                .filter(c -> c.getProductCount() > 0)
                .collect(Collectors.toList());
    }

    /**
     * Brendlar ro'yxati
     */
    public List<ShopBrandResponse> getBrands() {
        return brandRepository.findAll().stream()
                .map(brand -> {
                    long count = productRepository.findByBrandIdAndActiveTrue(brand.getId()).size();
                    return ShopBrandResponse.from(brand, count);
                })
                .filter(b -> b.getProductCount() > 0)
                .collect(Collectors.toList());
    }

    /**
     * Jalyuzi turlari ro'yxati
     */
    public List<ShopBlindTypeResponse> getBlindTypes() {
        Map<BlindType, Long> countMap = new HashMap<>();

        for (BlindType type : BlindType.values()) {
            long count = productRepository.findByBlindTypeAndActiveTrue(type).size();
            countMap.put(type, count);
        }

        return Arrays.stream(BlindType.values())
                .map(type -> ShopBlindTypeResponse.from(type, countMap.get(type)))
                .filter(t -> t.getProductCount() > 0)
                .collect(Collectors.toList());
    }

    /**
     * Materiallar ro'yxati
     */
    public List<ShopMaterialResponse> getMaterials() {
        Map<BlindMaterial, Long> countMap = new HashMap<>();

        for (BlindMaterial material : BlindMaterial.values()) {
            long count = productRepository.findByMaterialAndActiveTrue(material).size();
            countMap.put(material, count);
        }

        return Arrays.stream(BlindMaterial.values())
                .map(m -> ShopMaterialResponse.from(m, countMap.get(m)))
                .filter(m -> m.getProductCount() > 0)
                .collect(Collectors.toList());
    }

    // ==================== NARX HISOBLASH ====================

    /**
     * Narx hisoblash
     */
    public ShopPriceCalculateResponse calculatePrice(ShopPriceCalculateRequest request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", request.getProductId()));

        // O'lcham tekshirish
        boolean validDimensions = true;
        String dimensionError = null;

        if (product.getMinWidth() != null && request.getWidth() < product.getMinWidth()) {
            validDimensions = false;
            dimensionError = "Kenglik minimal " + product.getMinWidth() + " mm bo'lishi kerak";
        } else if (product.getMaxWidth() != null && request.getWidth() > product.getMaxWidth()) {
            validDimensions = false;
            dimensionError = "Kenglik maksimal " + product.getMaxWidth() + " mm bo'lishi mumkin";
        } else if (product.getMinHeight() != null && request.getHeight() < product.getMinHeight()) {
            validDimensions = false;
            dimensionError = "Balandlik minimal " + product.getMinHeight() + " mm bo'lishi kerak";
        } else if (product.getMaxHeight() != null && request.getHeight() > product.getMaxHeight()) {
            validDimensions = false;
            dimensionError = "Balandlik maksimal " + product.getMaxHeight() + " mm bo'lishi mumkin";
        }

        // Kvadrat metr hisoblash
        BigDecimal squareMeters = BigDecimal.valueOf(request.getWidth())
                .multiply(BigDecimal.valueOf(request.getHeight()))
                .divide(BigDecimal.valueOf(1_000_000), 4, RoundingMode.HALF_UP);

        // Mahsulot narxi
        BigDecimal productPrice;
        if (product.getPricePerSquareMeter() != null) {
            productPrice = product.getPricePerSquareMeter()
                    .multiply(squareMeters)
                    .setScale(0, RoundingMode.UP);
        } else {
            productPrice = product.getSellingPrice();
        }

        // O'rnatish narxi
        BigDecimal installationPrice = BigDecimal.ZERO;
        if (request.isWithInstallation() && product.getInstallationPrice() != null) {
            installationPrice = product.getInstallationPrice();
        }

        // Bir dona jami
        BigDecimal unitTotal = productPrice.add(installationPrice);

        // Miqdor bo'yicha
        int quantity = request.getQuantity() != null ? request.getQuantity() : 1;
        BigDecimal subtotal = productPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal installationTotal = installationPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal grandTotal = subtotal.add(installationTotal);

        return ShopPriceCalculateResponse.builder()
                .width(request.getWidth())
                .height(request.getHeight())
                .squareMeters(squareMeters)
                .productPrice(productPrice)
                .installationPrice(installationPrice)
                .unitTotal(unitTotal)
                .quantity(quantity)
                .subtotal(subtotal)
                .installationTotal(installationTotal)
                .grandTotal(grandTotal)
                .productName(product.getName())
                .blindTypeName(product.getBlindType() != null ? product.getBlindType().getDisplayName() : null)
                .materialName(product.getMaterial() != null ? product.getMaterial().getDisplayName() : null)
                .controlTypeName(product.getControlType() != null ? product.getControlType().getDisplayName() : null)
                .validDimensions(validDimensions)
                .dimensionError(dimensionError)
                .build();
    }

    // ==================== AUTENTIFIKATSIYA ====================

    /**
     * SMS kod yuborish
     */
    public void sendVerificationCode(String phone) {
        smsService.sendVerificationCode(phone);
    }

    /**
     * Kodni tasdiqlash
     */
    public boolean verifyCode(String phone, String code) {
        return smsService.verifyCode(phone, code);
    }

    /**
     * Ro'yxatdan o'tish
     */
    @Transactional
    public ShopAuthResponse register(ShopRegisterRequest request) {
        // Kodni tekshirish
        if (!smsService.verifyCode(request.getPhone(), request.getCode())) {
            throw new BadRequestException("Tasdiqlash kodi noto'g'ri");
        }

        // Telefon band emasligini tekshirish
        if (customerRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Bu telefon raqam allaqachon ro'yxatdan o'tgan");
        }

        // Mijoz yaratish
        Customer customer = Customer.builder()
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .address(request.getAddress())
                .customerType(CustomerType.INDIVIDUAL)
                .portalEnabled(true)
                .active(true)
                .build();

        customer = customerRepository.save(customer);

        // Token yaratish
        String accessToken = jwtTokenProvider.generateCustomerToken(customer);
        String refreshToken = jwtTokenProvider.generateCustomerRefreshToken(customer);

        return ShopAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationInSeconds())
                .customer(ShopCustomerResponse.from(customer))
                .build();
    }

    /**
     * Telefon orqali kirish
     */
    @Transactional
    public ShopAuthResponse login(String phone, String code) {
        // Kodni tekshirish
        if (!smsService.verifyCode(phone, code)) {
            throw new BadRequestException("Tasdiqlash kodi noto'g'ri");
        }

        // Mijozni topish
        Customer customer = customerRepository.findByPhone(phone)
                .orElseThrow(() -> new BadRequestException("Bu telefon raqam ro'yxatdan o'tmagan"));

        if (!customer.getActive()) {
            throw new BadRequestException("Akkaunt bloklangan");
        }

        // Oxirgi kirish vaqtini yangilash
        customer.setLastLoginAt(LocalDateTime.now());
        customer.setPortalEnabled(true);
        customerRepository.save(customer);

        // Token yaratish
        String accessToken = jwtTokenProvider.generateCustomerToken(customer);
        String refreshToken = jwtTokenProvider.generateCustomerRefreshToken(customer);

        return ShopAuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .expiresIn(jwtTokenProvider.getExpirationInSeconds())
                .customer(ShopCustomerResponse.from(customer))
                .build();
    }

    // ==================== BUYURTMALAR ====================

    /**
     * Buyurtma yaratish
     */
    @Transactional
    public ShopOrderResponse createOrder(ShopOrderRequest request, Customer customer) {
        // Agar autentifikatsiya qilinmagan bo'lsa, mijoz yaratish yoki topish
        if (customer == null) {
            if (request.getCustomerPhone() == null) {
                throw new BadRequestException("Telefon raqam kiritilishi shart");
            }

            customer = customerRepository.findByPhone(request.getCustomerPhone())
                    .orElseGet(() -> {
                        Customer newCustomer = Customer.builder()
                                .fullName(request.getCustomerName() != null ? request.getCustomerName() : "Mijoz")
                                .phone(request.getCustomerPhone())
                                .address(request.getDeliveryAddress())
                                .customerType(CustomerType.INDIVIDUAL)
                                .active(true)
                                .build();
                        return customerRepository.save(newCustomer);
                    });
        }

        // Buyurtma yaratish
        Sale sale = Sale.builder()
                .invoiceNumber(generateInvoiceNumber())
                .customer(customer)
                .saleDate(LocalDateTime.now())
                .paymentMethod(request.getPaymentMethod())
                .orderType(OrderType.PRODUCT_SALE)
                .installationAddress(request.getDeliveryAddress())
                .installationDate(request.getPreferredInstallationDate())
                .installationNotes(request.getInstallationNotes())
                .installationStatus(request.isWithInstallation() ? InstallationStatus.PENDING : null)
                .notes(request.getNotes())
                .status(SaleStatus.PENDING)
                .build();

        // Elementlarni qo'shish
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal installationTotal = BigDecimal.ZERO;
        List<SaleItem> items = new ArrayList<>();

        for (ShopOrderItemRequest itemRequest : request.getItems()) {
            Product product = productRepository.findById(itemRequest.getProductId())
                    .orElseThrow(() -> new ResourceNotFoundException("Mahsulot", "id", itemRequest.getProductId()));

            // Narx hisoblash
            BigDecimal squareMeters = BigDecimal.valueOf(itemRequest.getWidth())
                    .multiply(BigDecimal.valueOf(itemRequest.getHeight()))
                    .divide(BigDecimal.valueOf(1_000_000), 4, RoundingMode.HALF_UP);

            BigDecimal unitPrice;
            if (product.getPricePerSquareMeter() != null) {
                unitPrice = product.getPricePerSquareMeter()
                        .multiply(squareMeters)
                        .setScale(0, RoundingMode.UP);
            } else {
                unitPrice = product.getSellingPrice();
            }

            BigDecimal installationPrice = BigDecimal.ZERO;
            if (request.isWithInstallation() && product.getInstallationPrice() != null) {
                installationPrice = product.getInstallationPrice();
            }

            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));
            BigDecimal itemInstallation = installationPrice.multiply(BigDecimal.valueOf(itemRequest.getQuantity()));

            SaleItem item = SaleItem.builder()
                    .sale(sale)
                    .product(product)
                    .quantity(itemRequest.getQuantity())
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal.add(itemInstallation))
                    .customWidth(itemRequest.getWidth())
                    .customHeight(itemRequest.getHeight())
                    .calculatedSqm(squareMeters)
                    .installationPrice(installationPrice)
                    .notes(itemRequest.getNotes())
                    .build();

            items.add(item);
            subtotal = subtotal.add(itemTotal);
            installationTotal = installationTotal.add(itemInstallation);
        }

        sale.setItems(items);
        sale.setSubtotal(subtotal.add(installationTotal));
        sale.setTotalAmount(subtotal.add(installationTotal));
        sale.setPaidAmount(BigDecimal.ZERO);
        sale.setPaymentStatus(PaymentStatus.UNPAID);

        sale = saleRepository.save(sale);

        log.info("Yangi buyurtma yaratildi: {} - {}", sale.getInvoiceNumber(), customer.getPhone());

        return mapToOrderResponse(sale);
    }

    /**
     * Mijoz buyurtmalarini olish
     */
    public Page<ShopOrderResponse> getCustomerOrders(Customer customer, Pageable pageable) {
        Page<Sale> sales = saleRepository.findByCustomerIdOrderBySaleDateDesc(customer.getId(), pageable);
        return sales.map(this::mapToOrderResponse);
    }

    /**
     * Bitta buyurtmani olish
     */
    public ShopOrderResponse getOrder(Long orderId, Customer customer) {
        Sale sale = saleRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Buyurtma", "id", orderId));

        if (!sale.getCustomer().getId().equals(customer.getId())) {
            throw new BadRequestException("Bu buyurtma sizga tegishli emas");
        }

        return mapToOrderResponse(sale);
    }

    // ==================== HELPER METODLAR ====================

    private String generateInvoiceNumber() {
        String prefix = "WEB";
        String date = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String random = String.format("%04d", new Random().nextInt(10000));
        return prefix + date + random;
    }

    private ShopOrderResponse mapToOrderResponse(Sale sale) {
        List<ShopOrderItemResponse> items = sale.getItems().stream()
                .map(item -> ShopOrderItemResponse.builder()
                        .id(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .productSku(item.getProduct().getSku())
                        .blindTypeName(item.getProduct().getBlindType() != null
                                ? item.getProduct().getBlindType().getDisplayName() : null)
                        .materialName(item.getProduct().getMaterial() != null
                                ? item.getProduct().getMaterial().getDisplayName() : null)
                        .color(item.getProduct().getColor())
                        .controlType(item.getProduct().getControlType())
                        .controlTypeName(item.getProduct().getControlType() != null
                                ? item.getProduct().getControlType().getDisplayName() : null)
                        .width(item.getCustomWidth())
                        .height(item.getCustomHeight())
                        .squareMeters(item.getCalculatedSqm())
                        .unitPrice(item.getUnitPrice())
                        .installationPrice(item.getInstallationPrice())
                        .quantity(item.getQuantity())
                        .totalPrice(item.getTotalPrice())
                        .notes(item.getNotes())
                        .imageUrl(item.getProduct().getImageUrl())
                        .build())
                .collect(Collectors.toList());

        return ShopOrderResponse.builder()
                .id(sale.getId())
                .orderNumber(sale.getInvoiceNumber())
                .orderDate(sale.getSaleDate())
                .status(sale.getStatus())
                .statusName(getStatusName(sale.getStatus()))
                .paymentStatus(sale.getPaymentStatus())
                .paymentStatusName(getPaymentStatusName(sale.getPaymentStatus()))
                .items(items)
                .subtotal(sale.getSubtotal())
                .installationTotal(BigDecimal.ZERO) // TODO: kerakli bo'lsa alohida hisoblash
                .discountAmount(sale.getDiscountAmount())
                .totalAmount(sale.getTotalAmount())
                .paidAmount(sale.getPaidAmount())
                .remainingAmount(sale.getTotalAmount().subtract(sale.getPaidAmount() != null ? sale.getPaidAmount() : BigDecimal.ZERO))
                .paymentMethod(sale.getPaymentMethod())
                .paymentMethodName(getPaymentMethodName(sale.getPaymentMethod()))
                .deliveryAddress(sale.getInstallationAddress())
                .withInstallation(sale.getInstallationStatus() != null)
                .installationDate(sale.getInstallationDate())
                .installationNotes(sale.getInstallationNotes())
                .notes(sale.getNotes())
                .createdAt(sale.getCreatedAt())
                .build();
    }

    private String getStatusName(SaleStatus status) {
        if (status == null) return null;
        return switch (status) {
            case PENDING -> "Kutilmoqda";
            case COMPLETED -> "Yakunlangan";
            case CANCELLED -> "Bekor qilingan";
            case REFUNDED -> "Qaytarilgan";
        };
    }

    private String getPaymentStatusName(PaymentStatus status) {
        if (status == null) return null;
        return switch (status) {
            case PAID -> "To'langan";
            case PARTIAL -> "Qisman to'langan";
            case UNPAID -> "To'lanmagan";
        };
    }

    private String getPaymentMethodName(PaymentMethod method) {
        if (method == null) return null;
        return switch (method) {
            case CASH -> "Naqd";
            case CARD -> "Karta";
            case TRANSFER -> "O'tkazma";
            case DEBT -> "Qarzga";
        };
    }
}
