package uz.jalyuziepr.api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import uz.jalyuziepr.api.dto.response.BrandResponse;
import uz.jalyuziepr.api.entity.Brand;
import uz.jalyuziepr.api.exception.BadRequestException;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.BrandRepository;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BrandService {

    private final BrandRepository brandRepository;

    public List<BrandResponse> getAllBrands() {
        return brandRepository.findByActiveTrue().stream()
                .map(BrandResponse::from)
                .collect(Collectors.toList());
    }

    public BrandResponse getBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brend", "id", id));
        return BrandResponse.from(brand);
    }

    @Transactional
    public BrandResponse createBrand(String name, String country, String logoUrl) {
        if (brandRepository.existsByName(name)) {
            throw new BadRequestException("Bu brend allaqachon mavjud: " + name);
        }

        Brand brand = Brand.builder()
                .name(name)
                .country(country)
                .logoUrl(logoUrl)
                .active(true)
                .build();

        return BrandResponse.from(brandRepository.save(brand));
    }

    @Transactional
    public BrandResponse updateBrand(Long id, String name, String country, String logoUrl) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brend", "id", id));

        if (!brand.getName().equals(name) && brandRepository.existsByName(name)) {
            throw new BadRequestException("Bu brend allaqachon mavjud: " + name);
        }

        brand.setName(name);
        brand.setCountry(country);
        brand.setLogoUrl(logoUrl);

        return BrandResponse.from(brandRepository.save(brand));
    }

    @Transactional
    public void deleteBrand(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brend", "id", id));
        brand.setActive(false);
        brandRepository.save(brand);
    }
}
