package uz.jalyuziepr.api.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstallerCreateRequest {

    @NotBlank(message = "Ism familiya kiritilishi shart")
    @Size(max = 100, message = "Ism familiya 100 ta belgidan oshmasligi kerak")
    private String fullName;

    @NotBlank(message = "Telefon raqam kiritilishi shart")
    @Size(max = 20, message = "Telefon raqam 20 ta belgidan oshmasligi kerak")
    private String phone;

    @Email(message = "Email formati noto'g'ri")
    @Size(max = 100, message = "Email 100 ta belgidan oshmasligi kerak")
    private String email;

    @NotBlank(message = "Foydalanuvchi nomi kiritilishi shart")
    @Size(min = 3, max = 50, message = "Foydalanuvchi nomi 3-50 ta belgi bo'lishi kerak")
    private String username;

    @NotBlank(message = "Parol kiritilishi shart")
    @Size(min = 6, max = 100, message = "Parol kamida 6 ta belgi bo'lishi kerak")
    private String password;
}
