package uz.jalyuziepr.api.dto.request;

import lombok.Data;

/**
 * Joyida qayta o'lchov so'rovi (kotirovka va revision yaratish uchun).
 */
@Data
public class RemeasureRequest {
    private Integer widthMm;
    private Integer heightMm;
    private String note;
}
