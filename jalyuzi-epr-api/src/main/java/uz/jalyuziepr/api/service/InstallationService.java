package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.request.InstallationRequest;
import uz.jalyuziepr.api.dto.response.InstallationResponse;
import uz.jalyuziepr.api.entity.Employee;
import uz.jalyuziepr.api.entity.Installation;
import uz.jalyuziepr.api.entity.Sale;
import uz.jalyuziepr.api.entity.User;
import uz.jalyuziepr.api.enums.InstallationStatus;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.EmployeeRepository;
import uz.jalyuziepr.api.repository.InstallationRepository;
import uz.jalyuziepr.api.repository.SaleRepository;
import uz.jalyuziepr.api.repository.UserRepository;
import uz.jalyuziepr.api.security.CustomUserDetails;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InstallationService {

    private final InstallationRepository installationRepository;
    private final SaleRepository saleRepository;
    private final EmployeeRepository employeeRepository;
    private final UserRepository userRepository;

    public Page<InstallationResponse> getAllInstallations(Pageable pageable) {
        return installationRepository.findAll(pageable)
                .map(InstallationResponse::from);
    }

    public Page<InstallationResponse> getInstallationsWithFilters(
            Long technicianId, InstallationStatus status,
            LocalDate startDate, LocalDate endDate, Pageable pageable) {
        return installationRepository.findWithFilters(technicianId, status, startDate, endDate, pageable)
                .map(InstallationResponse::from);
    }

    public InstallationResponse getInstallationById(Long id) {
        Installation installation = installationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("O'rnatish", "id", id));
        return InstallationResponse.from(installation);
    }

    public List<InstallationResponse> getInstallationsBySaleId(Long saleId) {
        return installationRepository.findBySaleId(saleId).stream()
                .map(InstallationResponse::from)
                .collect(Collectors.toList());
    }

    public List<InstallationResponse> getInstallationsByTechnician(Long technicianId) {
        return installationRepository.findByTechnicianId(technicianId).stream()
                .map(InstallationResponse::from)
                .collect(Collectors.toList());
    }

    public List<InstallationResponse> getInstallationsByDate(LocalDate date) {
        return installationRepository.findByScheduledDate(date).stream()
                .map(InstallationResponse::from)
                .collect(Collectors.toList());
    }

    public List<InstallationResponse> getInstallationsByDateRange(LocalDate startDate, LocalDate endDate) {
        return installationRepository.findByDateRange(startDate, endDate).stream()
                .map(InstallationResponse::from)
                .collect(Collectors.toList());
    }

    public List<InstallationResponse> getTechnicianSchedule(Long technicianId, LocalDate startDate, LocalDate endDate) {
        return installationRepository.findByTechnicianAndDateRange(technicianId, startDate, endDate).stream()
                .map(InstallationResponse::from)
                .collect(Collectors.toList());
    }

    @Transactional
    public InstallationResponse createInstallation(InstallationRequest request) {
        Sale sale = saleRepository.findById(request.getSaleId())
                .orElseThrow(() -> new ResourceNotFoundException("Sotuv", "id", request.getSaleId()));

        Employee technician = employeeRepository.findById(request.getTechnicianId())
                .orElseThrow(() -> new ResourceNotFoundException("Texnik", "id", request.getTechnicianId()));

        if (!Boolean.TRUE.equals(technician.getIsTechnician())) {
            throw new BadRequestException("Tanlangan xodim texnik emas");
        }

        // Texnik bandligini tekshirish
        int existingCount = installationRepository.countTechnicianInstallationsForDate(
                request.getTechnicianId(), request.getScheduledDate());
        if (technician.getMaxDailyInstallations() != null && existingCount >= technician.getMaxDailyInstallations()) {
            throw new BadRequestException("Texnik shu kunga maksimal o'rnatishlar soniga yetgan");
        }

        Installation installation = Installation.builder()
                .sale(sale)
                .technician(technician)
                .scheduledDate(request.getScheduledDate())
                .scheduledTimeStart(request.getScheduledTimeStart())
                .scheduledTimeEnd(request.getScheduledTimeEnd())
                .status(InstallationStatus.SCHEDULED)
                .address(request.getAddress())
                .contactPhone(request.getContactPhone())
                .accessInstructions(request.getAccessInstructions())
                .notes(request.getNotes())
                .createdBy(getCurrentUser())
                .build();

        Installation saved = installationRepository.save(installation);

        // Sale'ni ham yangilash
        sale.setInstallationStatus(InstallationStatus.SCHEDULED);
        sale.setTechnician(technician);
        sale.setInstallationDate(request.getScheduledDate().atStartOfDay());
        sale.setInstallationAddress(request.getAddress());
        saleRepository.save(sale);

        return InstallationResponse.from(saved);
    }

    @Transactional
    public InstallationResponse updateInstallation(Long id, InstallationRequest request) {
        Installation installation = installationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("O'rnatish", "id", id));

        if (request.getTechnicianId() != null && !request.getTechnicianId().equals(installation.getTechnician().getId())) {
            Employee technician = employeeRepository.findById(request.getTechnicianId())
                    .orElseThrow(() -> new ResourceNotFoundException("Texnik", "id", request.getTechnicianId()));

            if (!Boolean.TRUE.equals(technician.getIsTechnician())) {
                throw new BadRequestException("Tanlangan xodim texnik emas");
            }

            installation.setTechnician(technician);
        }

        if (request.getScheduledDate() != null) {
            installation.setScheduledDate(request.getScheduledDate());
        }
        if (request.getScheduledTimeStart() != null) {
            installation.setScheduledTimeStart(request.getScheduledTimeStart());
        }
        if (request.getScheduledTimeEnd() != null) {
            installation.setScheduledTimeEnd(request.getScheduledTimeEnd());
        }
        if (request.getAddress() != null) {
            installation.setAddress(request.getAddress());
        }
        if (request.getContactPhone() != null) {
            installation.setContactPhone(request.getContactPhone());
        }
        if (request.getAccessInstructions() != null) {
            installation.setAccessInstructions(request.getAccessInstructions());
        }
        if (request.getNotes() != null) {
            installation.setNotes(request.getNotes());
        }

        return InstallationResponse.from(installationRepository.save(installation));
    }

    @Transactional
    public InstallationResponse updateStatus(Long id, InstallationStatus newStatus) {
        Installation installation = installationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("O'rnatish", "id", id));

        installation.setStatus(newStatus);

        if (newStatus == InstallationStatus.IN_PROGRESS) {
            installation.setActualDate(LocalDate.now());
            installation.setActualTimeStart(LocalTime.now());
        } else if (newStatus == InstallationStatus.COMPLETED) {
            installation.setActualTimeEnd(LocalTime.now());
            if (installation.getActualDate() == null) {
                installation.setActualDate(LocalDate.now());
            }
        }

        Installation saved = installationRepository.save(installation);

        // Sale statusini ham yangilash
        Sale sale = installation.getSale();
        sale.setInstallationStatus(newStatus);
        saleRepository.save(sale);

        return InstallationResponse.from(saved);
    }

    @Transactional
    public InstallationResponse completeInstallation(Long id, String completionNotes, String customerSignature) {
        Installation installation = installationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("O'rnatish", "id", id));

        installation.setStatus(InstallationStatus.COMPLETED);
        installation.setActualTimeEnd(LocalTime.now());
        if (installation.getActualDate() == null) {
            installation.setActualDate(LocalDate.now());
        }
        installation.setCompletionNotes(completionNotes);
        installation.setCustomerSignature(customerSignature);

        Installation saved = installationRepository.save(installation);

        // Sale statusini ham yangilash
        Sale sale = installation.getSale();
        sale.setInstallationStatus(InstallationStatus.COMPLETED);
        saleRepository.save(sale);

        return InstallationResponse.from(saved);
    }

    @Transactional
    public void cancelInstallation(Long id, String reason) {
        Installation installation = installationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("O'rnatish", "id", id));

        installation.setStatus(InstallationStatus.CANCELLED);
        installation.setNotes(installation.getNotes() != null ?
                installation.getNotes() + " | Bekor qilish sababi: " + reason :
                "Bekor qilish sababi: " + reason);

        installationRepository.save(installation);

        // Sale statusini ham yangilash
        Sale sale = installation.getSale();
        sale.setInstallationStatus(InstallationStatus.CANCELLED);
        saleRepository.save(sale);
    }

    public long countByStatus(InstallationStatus status) {
        return installationRepository.countByStatus(status);
    }

    public List<InstallationResponse> getUpcomingInstallations() {
        return installationRepository.findUpcomingInstallations(LocalDate.now().plusDays(7)).stream()
                .map(InstallationResponse::from)
                .collect(Collectors.toList());
    }

    private User getCurrentUser() {
        CustomUserDetails userDetails = (CustomUserDetails) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        return userRepository.findById(userDetails.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Foydalanuvchi", "id", userDetails.getId()));
    }
}
