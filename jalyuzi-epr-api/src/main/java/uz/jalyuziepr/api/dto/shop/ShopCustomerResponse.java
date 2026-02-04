package uz.jalyuziepr.api.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.entity.Customer;

/**
 * Mijoz ma'lumotlari
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopCustomerResponse {
    private Long id;
    private String fullName;
    private String phone;
    private String address;
    private String companyName;

    public static ShopCustomerResponse from(Customer customer) {
        return ShopCustomerResponse.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .companyName(customer.getCompanyName())
                .build();
    }
}
