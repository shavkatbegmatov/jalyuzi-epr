package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.WindowMeasurement;

import java.util.List;

@Repository
public interface WindowMeasurementRepository extends JpaRepository<WindowMeasurement, Long> {

    List<WindowMeasurement> findByCustomerId(Long customerId);

    List<WindowMeasurement> findByMeasuredById(Long employeeId);

    List<WindowMeasurement> findByCustomerIdOrderByRoomNameAscWindowNumberAsc(Long customerId);
}
