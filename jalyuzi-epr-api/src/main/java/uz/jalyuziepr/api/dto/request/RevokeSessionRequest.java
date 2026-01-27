package uz.jalyuziepr.api.dto.request;

import lombok.Data;

@Data
public class RevokeSessionRequest {
    private String reason;
}
