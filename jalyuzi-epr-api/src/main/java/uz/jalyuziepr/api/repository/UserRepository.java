package uz.jalyuziepr.api.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import uz.jalyuziepr.api.entity.User;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    List<User> findByActiveTrue();

    // ── Installer queries ──

    @Query("SELECT u FROM User u JOIN u.roles r WHERE r.code = 'INSTALLER' ORDER BY u.fullName")
    Page<User> findInstallers(Pageable pageable);

    @Query("""
        SELECT u FROM User u JOIN u.roles r
        WHERE r.code = 'INSTALLER'
        AND (LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(u.phone) LIKE LOWER(CONCAT('%', :search, '%'))
             OR LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')))
        ORDER BY u.fullName
        """)
    Page<User> searchInstallers(@Param("search") String search, Pageable pageable);

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.code = 'INSTALLER'")
    long countInstallers();

    @Query("SELECT COUNT(u) FROM User u JOIN u.roles r WHERE r.code = 'INSTALLER' AND u.active = true")
    long countActiveInstallers();

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.roles r
        LEFT JOIN FETCH r.permissions
        WHERE u.username = :username
        """)
    Optional<User> findByUsernameWithRolesAndPermissions(@Param("username") String username);

    @Query("""
        SELECT DISTINCT u FROM User u
        LEFT JOIN FETCH u.roles r
        LEFT JOIN FETCH r.permissions
        WHERE u.id = :id
        """)
    Optional<User> findByIdWithRolesAndPermissions(@Param("id") Long id);
}
