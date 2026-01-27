package uz.jalyuziepr.api.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import uz.jalyuziepr.api.annotation.ExportColumn;
import uz.jalyuziepr.api.annotation.ExportColumn.ColumnType;
import uz.jalyuziepr.api.annotation.ExportEntity;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@ExportEntity(sheetName = "Sozlamalar", title = "Sozlamalar Hisoboti")
public class SettingsResponse {
    @ExportColumn(header = "Qarz muddati (kunlar)", order = 1, type = ColumnType.NUMBER)
    private Integer debtDueDays;
}
