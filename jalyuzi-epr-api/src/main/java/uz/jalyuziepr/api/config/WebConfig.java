package uz.jalyuziepr.api.config;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import uz.jalyuziepr.api.audit.AuditCorrelationInterceptor;

import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Configuration
@RequiredArgsConstructor
public class WebConfig implements WebMvcConfigurer {

    private final AuditCorrelationInterceptor auditCorrelationInterceptor;

    @Value("${app.cors.allowed-origins:http://localhost:5175,http://localhost:3000,http://127.0.0.1:5175,http://192.168.1.33:5175,https://kanjaltib.uz,https://www.kanjaltib.uz,https://localhost,capacitor://localhost,http://localhost}")
    private String[] allowedOrigins;

    @Value("${app.storage.upload-dir:./uploads}")
    private String uploadDir;

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(auditCorrelationInterceptor)
                .addPathPatterns("/v1/**")  // Apply to all API endpoints
                .excludePathPatterns("/v1/auth/**");  // Exclude auth endpoints
    }

    /**
     * Yuklangan fayllarni public URL orqali xizmat ko'rsatish.
     * /api/files/orders/2026-05-21/uuid.jpg → ./uploads/orders/2026-05-21/uuid.jpg
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String location = Paths.get(uploadDir).toAbsolutePath().normalize().toUri().toString();
        registry.addResourceHandler("/files/**")
                .addResourceLocations(location)
                .setCachePeriod(3600);
    }

    private static final List<String> CAPACITOR_ORIGINS = List.of(
            "https://localhost",
            "capacitor://localhost",
            "http://localhost"
    );

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> mergedOrigins = new ArrayList<>(Arrays.asList(allowedOrigins));
        for (String origin : CAPACITOR_ORIGINS) {
            if (!mergedOrigins.contains(origin)) {
                mergedOrigins.add(origin);
            }
        }
        configuration.setAllowedOrigins(mergedOrigins);
        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setExposedHeaders(List.of("Authorization"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
