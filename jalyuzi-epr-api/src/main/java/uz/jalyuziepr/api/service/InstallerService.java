package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.InstallerCreateRequest;
import uz.jalyuziepr.api.dto.request.InstallerUpdateRequest;
import uz.jalyuziepr.api.dto.response.InstallerDetailResponse;
import uz.jalyuziepr.api.dto.response.InstallerResponse;
import uz.jalyuziepr.api.dto.response.InstallerStatsResponse;
import uz.jalyuziepr.api.dto.response.OrderResponse;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.RoleEntity;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.enums.OrderStatus;
import uz.jalyuziepr.api.enums.Role;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderPaymentRepository;
import uz.jalyuziepr.api.repository.OrderRepository;
import uz.jalyuziepr.api.repository.RoleRepository;
import uz.jalyuziepr.api.repository.UserRepository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstallerService {

    private static final String INSTALLER_ROLE_CODE = "INSTALLER";

    private static final List<OrderStatus> ACTIVE_STATUSES = List.of(
            OrderStatus.ORNATISHGA_TAYINLANDI,
            OrderStatus.ORNATISH_JARAYONIDA
    );

    private static final List<OrderStatus> COMPLETED_STATUSES = List.of(
            OrderStatus.ORNATISH_BAJARILDI,
            OrderStatus.TOLOV_KUTILMOQDA,
            OrderStatus.YAKUNLANDI,
            OrderStatus.QARZGA_OTKAZILDI
    );

    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final OrderPaymentRepository orderPaymentRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * Barcha o'rnatuvchilarni olish (paginated, search)
     */
    public Page<InstallerResponse> getAll(String search, Pageable pageable) {
        Page<User> installers = (search != null && !search.isBlank())
                ? userRepository.searchInstallers(search.trim(), pageable)
                : userRepository.findInstallers(pageable);

        return installers.map(this::toInstallerResponse);
    }

    /**
     * O'rnatuvchi tafsilotlarini olish
     */
    public InstallerDetailResponse getById(Long id) {
        User user = findInstallerById(id);
        return toInstallerDetailResponse(user);
    }

    /**
     * O'rnatuvchi buyurtmalarini olish
     */
    public Page<OrderResponse> getOrders(Long id, Pageable pageable) {
        findInstallerById(id); // validate exists
        return orderRepository.findByInstallerIdWithCustomer(id, pageable)
                .map(OrderResponse::fromList);
    }

    /**
     * Umumiy statistika
     */
    public InstallerStatsResponse getStats() {
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        LocalDateTime todayEnd = LocalDate.now().atTime(LocalTime.MAX);
        YearMonth thisMonth = YearMonth.now();
        LocalDateTime monthStart = thisMonth.atDay(1).atStartOfDay();
        LocalDateTime monthEnd = thisMonth.atEndOfMonth().atTime(LocalTime.MAX);

        return InstallerStatsResponse.builder()
                .totalInstallers(userRepository.countInstallers())
                .activeInstallers(userRepository.countActiveInstallers())
                .busyNow(orderRepository.countDistinctBusyInstallers())
                .completedToday(orderRepository.countCompletedInstallationsBetween(todayStart, todayEnd))
                .completedThisMonth(orderRepository.countCompletedInstallationsBetween(monthStart, monthEnd))
                .totalCollectedAmount(orderPaymentRepository.sumTotalCollectedByInstallers())
                .build();
    }

    /**
     * Yangi o'rnatuvchi yaratish
     */
    @Transactional
    public InstallerResponse create(InstallerCreateRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Bu foydalanuvchi nomi allaqachon band: " + request.getUsername());
        }

        RoleEntity installerRole = roleRepository.findByCode(INSTALLER_ROLE_CODE)
                .orElseThrow(() -> new ResourceNotFoundException("Rol", "code", INSTALLER_ROLE_CODE));

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .role(Role.INSTALLER)  // legacy field
                .active(true)
                .mustChangePassword(true)
                .build();

        user.getRoles().add(installerRole);
        User saved = userRepository.save(user);

        log.info("Yangi o'rnatuvchi yaratildi: {} ({})", saved.getFullName(), saved.getUsername());
        return toInstallerResponse(saved);
    }

    /**
     * O'rnatuvchi ma'lumotlarini yangilash
     */
    @Transactional
    public InstallerResponse update(Long id, InstallerUpdateRequest request) {
        User user = findInstallerById(id);

        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setEmail(request.getEmail());

        User saved = userRepository.save(user);
        log.info("O'rnatuvchi yangilandi: {} ({})", saved.getFullName(), saved.getUsername());
        return toInstallerResponse(saved);
    }

    /**
     * O'rnatuvchini faollashtirish/o'chirish
     */
    @Transactional
    public InstallerResponse toggleActive(Long id) {
        User user = findInstallerById(id);
        user.setActive(!user.getActive());
        User saved = userRepository.save(user);
        log.info("O'rnatuvchi {} holati: {}", saved.getFullName(), saved.getActive() ? "faol" : "nofaol");
        return toInstallerResponse(saved);
    }

    // ── Private helpers ──

    private User findInstallerById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("O'rnatuvchi", "id", id));
        // Verify user has INSTALLER role
        boolean isInstaller = user.getRoles().stream()
                .anyMatch(r -> INSTALLER_ROLE_CODE.equals(r.getCode()));
        if (!isInstaller) {
            throw new ResourceNotFoundException("O'rnatuvchi", "id", id);
        }
        return user;
    }

    private InstallerResponse toInstallerResponse(User user) {
        long activeOrders = orderRepository.countByInstallerIdAndStatusIn(user.getId(), ACTIVE_STATUSES);
        long completedOrders = orderRepository.countByInstallerIdAndStatusIn(user.getId(), COMPLETED_STATUSES);
        BigDecimal collected = orderPaymentRepository.sumCollectedByUserId(user.getId());

        // Joriy buyurtma raqamini olish
        String currentOrderNumber = null;
        List<Order> activeOrderList = orderRepository.findByInstallerIdAndStatusIn(user.getId(), ACTIVE_STATUSES);
        if (!activeOrderList.isEmpty()) {
            currentOrderNumber = activeOrderList.get(0).getOrderNumber();
        }

        return InstallerResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .username(user.getUsername())
                .active(user.getActive())
                .activeOrdersCount(activeOrders)
                .completedOrdersCount(completedOrders)
                .totalCollectedAmount(collected)
                .currentOrderNumber(currentOrderNumber)
                .build();
    }

    private InstallerDetailResponse toInstallerDetailResponse(User user) {
        long activeOrders = orderRepository.countByInstallerIdAndStatusIn(user.getId(), ACTIVE_STATUSES);
        long completedOrders = orderRepository.countByInstallerIdAndStatusIn(user.getId(), COMPLETED_STATUSES);
        BigDecimal collected = orderPaymentRepository.sumCollectedByUserId(user.getId());

        // Joriy buyurtma
        String currentOrderNumber = null;
        List<Order> activeOrderList = orderRepository.findByInstallerIdAndStatusIn(user.getId(), ACTIVE_STATUSES);
        if (!activeOrderList.isEmpty()) {
            currentOrderNumber = activeOrderList.get(0).getOrderNumber();
        }

        // Oylik statistika
        YearMonth thisMonth = YearMonth.now();
        YearMonth lastMonth = thisMonth.minusMonths(1);

        long completedThisMonth = orderRepository.countByInstallerIdAndStatusInAndCompletedDateBetween(
                user.getId(), COMPLETED_STATUSES,
                thisMonth.atDay(1).atStartOfDay(),
                thisMonth.atEndOfMonth().atTime(LocalTime.MAX));

        long completedLastMonth = orderRepository.countByInstallerIdAndStatusInAndCompletedDateBetween(
                user.getId(), COMPLETED_STATUSES,
                lastMonth.atDay(1).atStartOfDay(),
                lastMonth.atEndOfMonth().atTime(LocalTime.MAX));

        return InstallerDetailResponse.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .email(user.getEmail())
                .username(user.getUsername())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .activeOrdersCount(activeOrders)
                .completedOrdersCount(completedOrders)
                .totalCollectedAmount(collected)
                .currentOrderNumber(currentOrderNumber)
                .completedThisMonth(completedThisMonth)
                .completedLastMonth(completedLastMonth)
                .avgCompletionHours(null) // Keyinchalik hisoblash mumkin
                .build();
    }
}
