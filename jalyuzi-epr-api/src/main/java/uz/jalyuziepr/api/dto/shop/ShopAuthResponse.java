package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Autentifikatsiya javobi
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopAuthResponse {
    private String accessToken;
    private String refreshToken;
    private Long expiresIn;
    private ShopCustomerResponse customer;
}
