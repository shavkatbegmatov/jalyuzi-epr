package uz.jalyuziepr.api.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import uz.jalyuziepr.api.enums.PermissionCode;
import uz.jalyuziepr.api.security.RequiresPermission;
import uz.jalyuziepr.api.service.export.OrderDocumentService;

/**
 * Buyurtmaga tegishli rasmiy hujjatlar PDF eksporti.
 */
@RestController
@RequestMapping("/v1/orders/{orderId}/documents")
@RequiredArgsConstructor
@Tag(name = "Order Documents", description = "Faktura, akt, garantiya talonchi PDF")
public class OrderDocumentController {

    private final OrderDocumentService documentService;

    @GetMapping("/invoice")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Faktura PDF")
    public ResponseEntity<byte[]> invoice(@PathVariable Long orderId) {
        byte[] pdf = documentService.generateInvoice(orderId);
        return pdfResponse(pdf, "faktura-" + orderId + ".pdf");
    }

    @GetMapping("/act")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "O'rnatish akti PDF")
    public ResponseEntity<byte[]> act(@PathVariable Long orderId) {
        byte[] pdf = documentService.generateInstallationAct(orderId);
        return pdfResponse(pdf, "akt-" + orderId + ".pdf");
    }

    @GetMapping("/warranty")
    @RequiresPermission(PermissionCode.ORDERS_VIEW)
    @Operation(summary = "Garantiya talonchi PDF")
    public ResponseEntity<byte[]> warranty(@PathVariable Long orderId) {
        byte[] pdf = documentService.generateWarranty(orderId);
        return pdfResponse(pdf, "garantiya-" + orderId + ".pdf");
    }

    private ResponseEntity<byte[]> pdfResponse(byte[] pdf, String filename) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentLength(pdf.length);
        return new ResponseEntity<>(pdf, headers, org.springframework.http.HttpStatus.OK);
    }
}
