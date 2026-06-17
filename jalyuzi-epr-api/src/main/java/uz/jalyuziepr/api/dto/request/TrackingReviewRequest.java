package uz.jalyuziepr.api.dto.request;

import lombok.Data;

/**
 * Ommaviy kuzatuv sahifasidan mijoz bahosi (NPS / sharh).
 */
@Data
public class TrackingReviewRequest {
    private Integer rating;   // 1..5
    private String comment;
}
