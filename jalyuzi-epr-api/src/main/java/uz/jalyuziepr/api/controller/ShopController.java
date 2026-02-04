package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.web.PageableDefault;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.dto.response.ApiResponse;
import uz.jalyuziepr.api.dto.response.PagedResponse;
import uz.jalyuziepr.api.dto.shop.*;
import uz.jalyuziepr.api.entity.Customer;
import uz.jalyuziepr.api.enums.BlindMaterial;
import uz.jalyuziepr.api.enums.BlindType;
import uz.jalyuziepr.api.enums.ControlType;
import uz.jalyuziepr.api.repository.CustomerRepository;
import uz.jalyuziepr.api.security.CustomerUserDetails;
import uz.jalyuziepr.api.service.ShopService;

import java.util.List;

/**
 * Internet-do'kon uchun Public API
 */
@RestController
@RequestMapping("/v1/shop")
@RequiredArgsConstructor
@Tag(name = "Shop", description = "Internet-do'kon API - Public")
public class ShopController {

    private final ShopService shopService;
    private final CustomerRepository customerRepository;

    // ==================== KATALOG (PUBLIC) ====================

    @GetMapping("/products")
    @Operation(summary = "Mahsulotlar katalogi", description = "Barcha faol mahsulotlarni olish")
    public ResponseEntity<ApiResponse<PagedResponse<ShopProductResponse>>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long brandId,
            @RequestParam(required = false) List<BlindType> blindTypes,
            @RequestParam(required = false) List<BlindMaterial> materials,
            @RequestParam(required = false) List<ControlType> controlTypes,
            @RequestParam(required = false) List<String> colors,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortDirection,
            @RequestParam(required = false) boolean inStockOnly,
            @PageableDefault(size = 12) Pageable pageable) {

        ShopProductFilter filter = ShopProductFilter.builder()
                .search(search)
                .categoryId(categoryId)
                .brandId(brandId)
                .blindTypes(blindTypes)
                .materials(materials)
                .controlTypes(controlTypes)
                .colors(colors)
                .sortBy(sortBy)
                .sortDirection(sortDirection)
                .inStockOnly(inStockOnly)
                .build();

        Page<ShopProductResponse> products = shopService.getProducts(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(products)));
    }

    @GetMapping("/products/{id}")
    @Operation(summary = "Mahsulot detail", description = "Mahsulot to'liq ma'lumotlarini olish")
    public ResponseEntity<ApiResponse<ShopProductResponse>> getProduct(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(shopService.getProduct(id)));
    }

    @GetMapping("/categories")
    @Operation(summary = "Kategoriyalar", description = "Barcha kategoriyalarni olish")
    public ResponseEntity<ApiResponse<List<ShopCategoryResponse>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(shopService.getCategories()));
    }

    @GetMapping("/brands")
    @Operation(summary = "Brendlar", description = "Barcha brendlarni olish")
    public ResponseEntity<ApiResponse<List<ShopBrandResponse>>> getBrands() {
        return ResponseEntity.ok(ApiResponse.success(shopService.getBrands()));
    }

    @GetMapping("/blind-types")
    @Operation(summary = "Jalyuzi turlari", description = "Barcha jalyuzi turlarini olish")
    public ResponseEntity<ApiResponse<List<ShopBlindTypeResponse>>> getBlindTypes() {
        return ResponseEntity.ok(ApiResponse.success(shopService.getBlindTypes()));
    }

    @GetMapping("/materials")
    @Operation(summary = "Materiallar", description = "Barcha materiallarni olish")
    public ResponseEntity<ApiResponse<List<ShopMaterialResponse>>> getMaterials() {
        return ResponseEntity.ok(ApiResponse.success(shopService.getMaterials()));
    }

    // ==================== NARX HISOBLASH (PUBLIC) ====================

    @PostMapping("/calculate-price")
    @Operation(summary = "Narx hisoblash", description = "O'lcham bo'yicha narx hisoblash")
    public ResponseEntity<ApiResponse<ShopPriceCalculateResponse>> calculatePrice(
            @Valid @RequestBody ShopPriceCalculateRequest request) {
        return ResponseEntity.ok(ApiResponse.success(shopService.calculatePrice(request)));
    }

    // ==================== AUTENTIFIKATSIYA (PUBLIC) ====================

    @PostMapping("/auth/send-code")
    @Operation(summary = "SMS kod yuborish", description = "Telefon raqamga tasdiqlash kodi yuborish")
    public ResponseEntity<ApiResponse<String>> sendCode(
            @Valid @RequestBody ShopSendCodeRequest request) {
        shopService.sendVerificationCode(request.getPhone());
        return ResponseEntity.ok(ApiResponse.success("Tasdiqlash kodi yuborildi"));
    }

    @PostMapping("/auth/verify-code")
    @Operation(summary = "Kodni tasdiqlash", description = "SMS kodni tekshirish")
    public ResponseEntity<ApiResponse<Boolean>> verifyCode(
            @Valid @RequestBody ShopVerifyCodeRequest request) {
        boolean verified = shopService.verifyCode(request.getPhone(), request.getCode());
        if (verified) {
            return ResponseEntity.ok(ApiResponse.success("Telefon tasdiqlandi", true));
        } else {
            return ResponseEntity.ok(ApiResponse.error("Noto'g'ri kod"));
        }
    }

    @PostMapping("/auth/register")
    @Operation(summary = "Ro'yxatdan o'tish", description = "Yangi mijoz yaratish")
    public ResponseEntity<ApiResponse<ShopAuthResponse>> register(
            @Valid @RequestBody ShopRegisterRequest request) {
        ShopAuthResponse response = shopService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Ro'yxatdan o'tdingiz", response));
    }

    @PostMapping("/auth/login")
    @Operation(summary = "Kirish", description = "Telefon va kod orqali kirish")
    public ResponseEntity<ApiResponse<ShopAuthResponse>> login(
            @Valid @RequestBody ShopVerifyCodeRequest request) {
        ShopAuthResponse response = shopService.login(request.getPhone(), request.getCode());
        return ResponseEntity.ok(ApiResponse.success("Muvaffaqiyatli kirdingiz", response));
    }

    // ==================== BUYURTMALAR (AUTHENTICATED) ====================

    @PostMapping("/orders")
    @Operation(summary = "Buyurtma yaratish", description = "Yangi buyurtma berish")
    public ResponseEntity<ApiResponse<ShopOrderResponse>> createOrder(
            @Valid @RequestBody ShopOrderRequest request,
            @AuthenticationPrincipal CustomerUserDetails customerDetails) {

        Customer customer = null;
        if (customerDetails != null) {
            customer = customerRepository.findById(customerDetails.getId()).orElse(null);
        }

        ShopOrderResponse response = shopService.createOrder(request, customer);
        return ResponseEntity.ok(ApiResponse.success("Buyurtma qabul qilindi", response));
    }

    @GetMapping("/orders")
    @Operation(summary = "Mening buyurtmalarim", description = "Joriy mijozning buyurtmalarini olish")
    public ResponseEntity<ApiResponse<PagedResponse<ShopOrderResponse>>> getMyOrders(
            @AuthenticationPrincipal CustomerUserDetails customerDetails,
            @PageableDefault(size = 10) Pageable pageable) {

        if (customerDetails == null) {
            return ResponseEntity.ok(ApiResponse.error("Avtorizatsiya talab qilinadi"));
        }

        Customer customer = customerRepository.findById(customerDetails.getId())
                .orElseThrow(() -> new RuntimeException("Mijoz topilmadi"));

        Page<ShopOrderResponse> orders = shopService.getCustomerOrders(customer, pageable);
        return ResponseEntity.ok(ApiResponse.success(PagedResponse.from(orders)));
    }

    @GetMapping("/orders/{id}")
    @Operation(summary = "Buyurtma detail", description = "Buyurtma to'liq ma'lumotlarini olish")
    public ResponseEntity<ApiResponse<ShopOrderResponse>> getOrder(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomerUserDetails customerDetails) {

        if (customerDetails == null) {
            return ResponseEntity.ok(ApiResponse.error("Avtorizatsiya talab qilinadi"));
        }

        Customer customer = customerRepository.findById(customerDetails.getId())
                .orElseThrow(() -> new RuntimeException("Mijoz topilmadi"));

        ShopOrderResponse response = shopService.getOrder(id, customer);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/profile")
    @Operation(summary = "Profil", description = "Joriy mijoz profilini olish")
    public ResponseEntity<ApiResponse<ShopCustomerResponse>> getProfile(
            @AuthenticationPrincipal CustomerUserDetails customerDetails) {

        if (customerDetails == null) {
            return ResponseEntity.ok(ApiResponse.error("Avtorizatsiya talab qilinadi"));
        }

        Customer customer = customerRepository.findById(customerDetails.getId())
                .orElseThrow(() -> new RuntimeException("Mijoz topilmadi"));

        return ResponseEntity.ok(ApiResponse.success(ShopCustomerResponse.from(customer)));
    }
}
