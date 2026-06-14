package uz.jalyuziepr.api.service.export;

import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import uz.jalyuziepr.api.entity.Order;
import uz.jalyuziepr.api.entity.OrderItem;
import uz.jalyuziepr.api.exception.ResourceNotFoundException;
import uz.jalyuziepr.api.repository.OrderRepository;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.Locale;

/**
 * Buyurtmaga tegishli rasmiy hujjatlarni PDF formatda yaratadi:
 *  - INVOICE  : Faktura (mijozga yuborish uchun)
 *  - ACT      : O'rnatish akti (yakunlangan ishni qabul qilish hujjati)
 *  - WARRANTY : Garantiya talonchi
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OrderDocumentService {

    private final OrderRepository orderRepository;

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy");
    private static final DateTimeFormatter DATETIME = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private static final Font TITLE = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, Color.BLACK);
    private static final Font H2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12, Color.BLACK);
    private static final Font BODY = FontFactory.getFont(FontFactory.HELVETICA, 10, Color.BLACK);
    private static final Font BODY_BOLD = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.BLACK);
    private static final Font SMALL = FontFactory.getFont(FontFactory.HELVETICA, 8, Color.GRAY);

    private static final Color HEADER_BG = new Color(15, 118, 110); // brand teal
    private static final Color ROW_ALT = new Color(248, 250, 252);

    public byte[] generateInvoice(Long orderId) {
        Order order = loadOrder(orderId);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            writeCompanyHeader(doc, "FAKTURA", order.getOrderNumber());
            writeCustomerBlock(doc, order);
            writeItemsTable(doc, order, /* showInstallation */ true);
            writeTotalsBlock(doc, order);
            writeFooter(doc, "Faktura " + DATETIME.format(LocalDateTime.now()) + " da yaratildi");

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate invoice for order {}", orderId, e);
            throw new RuntimeException("Faktura yaratishda xatolik: " + e.getMessage());
        }
    }

    public byte[] generateInstallationAct(Long orderId) {
        Order order = loadOrder(orderId);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            writeCompanyHeader(doc, "O'RNATISH AKTI", order.getOrderNumber());

            Paragraph intro = new Paragraph(
                    "Mazkur akt " + DATE.format(LocalDateTime.now()) +
                            " kuni " + safe(order.getCustomer() != null ? order.getCustomer().getFullName() : "—") +
                            " (keyingi o'rinlarda \"Mijoz\") va ishlab chiqaruvchi-o'rnatuvchi " +
                            "tashkilot o'rtasida quyidagi mahsulotlarning o'rnatilishini qabul qilish " +
                            "yuzasidan tuzildi:",
                    BODY);
            intro.setSpacingAfter(8);
            doc.add(intro);

            writeItemsTable(doc, order, /* showInstallation */ true);

            // O'rnatish ma'lumotlari
            doc.add(new Paragraph(" ", BODY));
            Paragraph instSection = new Paragraph("O'rnatish ma'lumotlari:", H2);
            instSection.setSpacingAfter(6);
            doc.add(instSection);

            doc.add(kvLine("Manzil", safe(order.getInstallationAddress())));
            doc.add(kvLine("O'lchov sanasi", order.getMeasurementDate() != null ? DATE.format(order.getMeasurementDate()) : "—"));
            doc.add(kvLine("O'rnatish sanasi", order.getInstallationDate() != null ? DATE.format(order.getInstallationDate()) : "—"));
            doc.add(kvLine("Yakunlangan sana", order.getCompletedDate() != null ? DATE.format(order.getCompletedDate()) : "—"));
            doc.add(kvLine("Usta", order.getInstaller() != null ? safe(order.getInstaller().getFullName()) : "—"));

            // Tasdiqlash bo'limi
            doc.add(new Paragraph(" ", BODY));
            doc.add(new Paragraph(" ", BODY));
            Paragraph confirmText = new Paragraph(
                    "Ko'rsatilgan mahsulotlar o'rnatildi, ishonchli ishlashi tekshirildi. " +
                            "Mijoz tomonidan bajarilgan ishlarga e'tiroz bildirilmadi.",
                    BODY);
            confirmText.setSpacingAfter(20);
            doc.add(confirmText);

            // Imzo joylari
            PdfPTable sigs = new PdfPTable(2);
            sigs.setWidthPercentage(100);
            // Mijoz katakchasiga dala'da olingan haqiqiy imzo rasmi joylanadi (mavjud bo'lsa)
            sigs.addCell(signatureCell(
                    "Buyurtmachi (Mijoz)",
                    order.getCustomer() != null ? safe(order.getCustomer().getFullName()) : "",
                    order.getCustomerSignature()));
            sigs.addCell(signatureCell(
                    "Ijrochi (Usta)",
                    order.getInstaller() != null ? safe(order.getInstaller().getFullName()) : "",
                    null));
            doc.add(sigs);

            writeFooter(doc, "Akt " + DATETIME.format(LocalDateTime.now()) + " da yaratildi");

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate act for order {}", orderId, e);
            throw new RuntimeException("Akt yaratishda xatolik: " + e.getMessage());
        }
    }

    public byte[] generateWarranty(Long orderId) {
        Order order = loadOrder(orderId);
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(doc, out);
            doc.open();

            writeCompanyHeader(doc, "GARANTIYA TALONCHI", order.getOrderNumber());

            // Talon nomeri va sanasi
            PdfPTable meta = new PdfPTable(2);
            meta.setWidthPercentage(100);
            meta.setSpacingAfter(12);
            meta.setWidths(new float[]{1, 2});
            meta.addCell(kvCell("Talon raqami", order.getOrderNumber(), true));
            meta.addCell(kvCell("Berilgan sana", DATE.format(LocalDateTime.now()), true));
            meta.addCell(kvCell("Mijoz", order.getCustomer() != null ? safe(order.getCustomer().getFullName()) : "—", false));
            meta.addCell(kvCell("Telefon", order.getCustomer() != null ? safe(order.getCustomer().getPhone()) : "—", false));
            doc.add(meta);

            // Mahsulotlar
            writeItemsTable(doc, order, /* showInstallation */ false);

            // Kafolat shartlari
            doc.add(new Paragraph(" ", BODY));
            Paragraph terms = new Paragraph("Kafolat shartlari:", H2);
            terms.setSpacingAfter(6);
            doc.add(terms);

            String[] termsList = {
                    "1. Kafolat muddati: o'rnatilgan kundan boshlab 24 oy.",
                    "2. Kafolat mahsulot mexanizmi va materialida ishlab chiqarish nuqsonlarini qoplaydi.",
                    "3. Quyidagi hollar kafolat ostida emas:",
                    "   - Mijoz tomonidan noto'g'ri foydalanish",
                    "   - Mexanik shikastlanish (urilish, qattiq tortish, suvga tegishi)",
                    "   - Mijoz yoki uchinchi shaxs tomonidan mustaqil ta'mirlash urinishi",
                    "   - Tabiiy ofatlar (suv toshqini, yong'in, zilzila va h.k.)",
                    "4. Kafolat xizmati uchun ushbu talonchini saqlashingiz va qo'ng'iroq qilishingiz kerak.",
                    "5. Brakka uchragan mahsulot 5 ish kuni ichida tekshiriladi va tuzatiladi yoki almashtiriladi."
            };
            for (String t : termsList) {
                Paragraph p = new Paragraph(t, BODY);
                p.setSpacingAfter(2);
                doc.add(p);
            }

            // Aloqa
            doc.add(new Paragraph(" ", BODY));
            Paragraph contact = new Paragraph("Kafolat xizmati uchun aloqa:", H2);
            contact.setSpacingAfter(4);
            doc.add(contact);
            doc.add(new Paragraph("Veb-sayt: https://kanjaltib.uz", BODY));

            writeFooter(doc, "Talonchi " + DATETIME.format(LocalDateTime.now()) + " da yaratildi");

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate warranty for order {}", orderId, e);
            throw new RuntimeException("Talonchi yaratishda xatolik: " + e.getMessage());
        }
    }

    // ==================== HELPERS ====================

    private Order loadOrder(Long orderId) {
        return orderRepository.findByIdWithAllDetails(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
    }

    private void writeCompanyHeader(Document doc, String documentType, String orderNumber) throws DocumentException {
        Paragraph company = new Paragraph("KANJALTIB.UZ", H2);
        company.setAlignment(Element.ALIGN_CENTER);
        doc.add(company);

        Paragraph subtitle = new Paragraph("Jalyuzi ishlab chiqarish va o'rnatish", SMALL);
        subtitle.setAlignment(Element.ALIGN_CENTER);
        subtitle.setSpacingAfter(12);
        doc.add(subtitle);

        Paragraph title = new Paragraph(documentType + " № " + orderNumber, TITLE);
        title.setAlignment(Element.ALIGN_CENTER);
        title.setSpacingAfter(16);
        doc.add(title);
    }

    private void writeCustomerBlock(Document doc, Order order) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(100);
        t.setSpacingAfter(12);
        t.setWidths(new float[]{1, 2});

        String name = order.getCustomer() != null ? safe(order.getCustomer().getFullName()) : "—";
        String phone = order.getCustomer() != null ? safe(order.getCustomer().getPhone()) : "—";

        t.addCell(kvCell("Mijoz", name, false));
        t.addCell(kvCell("Telefon", phone, false));
        t.addCell(kvCell("Manzil", safe(order.getInstallationAddress()), false));
        t.addCell(kvCell("Buyurtma sanasi", order.getCreatedAt() != null ? DATE.format(order.getCreatedAt()) : "—", false));
        doc.add(t);
    }

    private void writeItemsTable(Document doc, Order order, boolean showInstallation) throws DocumentException {
        int cols = showInstallation ? 7 : 6;
        PdfPTable table = new PdfPTable(cols);
        table.setWidthPercentage(100);
        table.setSpacingBefore(6);
        table.setSpacingAfter(12);
        if (showInstallation) {
            table.setWidths(new float[]{0.5f, 2.5f, 1, 1, 0.7f, 1.3f, 1.3f});
        } else {
            table.setWidths(new float[]{0.5f, 3, 1.2f, 1, 1, 1.3f});
        }

        // Headers
        String[] headers = showInstallation
                ? new String[]{"#", "Mahsulot", "Xona", "O'lcham (mm)", "Soni", "O'rnatish", "Narx"}
                : new String[]{"#", "Mahsulot", "Xona", "O'lcham (mm)", "Soni", "Narx"};
        for (String h : headers) {
            table.addCell(headerCell(h));
        }

        // Rows
        int i = 1;
        for (OrderItem item : order.getItems()) {
            boolean alt = (i % 2 == 0);
            table.addCell(bodyCell(String.valueOf(i++), alt, false));
            table.addCell(bodyCell(safe(item.getProduct() != null ? item.getProduct().getName() : "—"), alt, false));
            table.addCell(bodyCell(safe(item.getRoomName()), alt, false));
            String size = (item.getWidthMm() != null ? item.getWidthMm() : 0) + " × " +
                    (item.getHeightMm() != null ? item.getHeightMm() : 0);
            table.addCell(bodyCell(size, alt, false));
            table.addCell(bodyCell(item.getQuantity() != null ? item.getQuantity().toString() : "—", alt, false));
            if (showInstallation) {
                String inst = item.getInstallationIncluded() != null && item.getInstallationIncluded()
                        ? money(item.getInstallationPrice())
                        : "—";
                table.addCell(bodyCell(inst, alt, true));
            }
            table.addCell(bodyCell(money(item.getTotalPrice()), alt, true));
        }
        doc.add(table);
    }

    private void writeTotalsBlock(Document doc, Order order) throws DocumentException {
        PdfPTable t = new PdfPTable(2);
        t.setWidthPercentage(50);
        t.setHorizontalAlignment(Element.ALIGN_RIGHT);
        t.setWidths(new float[]{2, 1});

        t.addCell(totalsLabel("Oraliq summa"));
        t.addCell(totalsValue(money(order.getSubtotal())));

        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            t.addCell(totalsLabel("Chegirma"));
            t.addCell(totalsValue("-" + money(order.getDiscountAmount())));
        }

        PdfPCell lbl = totalsLabel("JAMI");
        lbl.setBackgroundColor(HEADER_BG);
        lbl.setPhrase(new Phrase("JAMI", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE)));
        t.addCell(lbl);

        PdfPCell val = totalsValue(money(order.getTotalAmount()));
        val.setBackgroundColor(HEADER_BG);
        val.setPhrase(new Phrase(money(order.getTotalAmount()), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11, Color.WHITE)));
        t.addCell(val);

        if (order.getPaidAmount() != null && order.getPaidAmount().compareTo(BigDecimal.ZERO) > 0) {
            t.addCell(totalsLabel("To'langan"));
            t.addCell(totalsValue(money(order.getPaidAmount())));
            t.addCell(totalsLabel("Qoldiq"));
            t.addCell(totalsValue(money(order.getRemainingAmount())));
        }

        doc.add(t);
    }

    private void writeFooter(Document doc, String text) throws DocumentException {
        doc.add(new Paragraph(" ", SMALL));
        doc.add(new Paragraph(" ", SMALL));
        Paragraph p = new Paragraph(text, SMALL);
        p.setAlignment(Element.ALIGN_CENTER);
        doc.add(p);
    }

    private Paragraph kvLine(String key, String value) {
        Paragraph p = new Paragraph();
        p.add(new Chunk(key + ": ", BODY_BOLD));
        p.add(new Chunk(safe(value), BODY));
        p.setSpacingAfter(2);
        return p;
    }

    private PdfPCell kvCell(String key, String value, boolean bold) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.BOX);
        c.setBorderColor(Color.LIGHT_GRAY);
        c.setPadding(6);
        Phrase ph = new Phrase();
        ph.add(new Chunk(key + ": ", BODY_BOLD));
        ph.add(new Chunk(safe(value), bold ? BODY_BOLD : BODY));
        c.setPhrase(ph);
        return c;
    }

    private PdfPCell headerCell(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Color.WHITE)));
        c.setBackgroundColor(HEADER_BG);
        c.setPadding(6);
        c.setHorizontalAlignment(Element.ALIGN_CENTER);
        return c;
    }

    private PdfPCell bodyCell(String text, boolean alt, boolean money) {
        PdfPCell c = new PdfPCell(new Phrase(text, BODY));
        c.setBackgroundColor(alt ? ROW_ALT : Color.WHITE);
        c.setPadding(5);
        c.setHorizontalAlignment(money ? Element.ALIGN_RIGHT : Element.ALIGN_LEFT);
        return c;
    }

    private PdfPCell totalsLabel(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, BODY));
        c.setPadding(6);
        c.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c.setBorder(Rectangle.BOX);
        c.setBorderColor(Color.LIGHT_GRAY);
        return c;
    }

    private PdfPCell totalsValue(String text) {
        PdfPCell c = new PdfPCell(new Phrase(text, BODY_BOLD));
        c.setPadding(6);
        c.setHorizontalAlignment(Element.ALIGN_RIGHT);
        c.setBorder(Rectangle.BOX);
        c.setBorderColor(Color.LIGHT_GRAY);
        return c;
    }

    private PdfPCell signatureCell(String role, String name, String base64Signature) {
        PdfPCell c = new PdfPCell();
        c.setBorder(Rectangle.NO_BORDER);
        c.setPadding(10);

        Paragraph roleP = new Paragraph(role + ":", BODY_BOLD);
        roleP.setSpacingAfter(4);
        c.addElement(roleP);

        Image sig = decodeSignature(base64Signature);
        if (sig != null) {
            sig.scaleToFit(170, 60);
            c.addElement(sig);
        } else {
            c.addElement(new Paragraph("\n_________________________", BODY));
        }

        c.addElement(new Paragraph(name, BODY));
        c.addElement(new Paragraph("(imzo / sana)", SMALL));
        return c;
    }

    /**
     * "data:image/png;base64,...." ko'rinishidagi imzoni PDF rasmiga aylantiradi.
     * Format noto'g'ri yoki bo'sh bo'lsa null qaytadi (PDF imzo chizig'i bilan chiqadi).
     */
    private Image decodeSignature(String dataUrl) {
        if (dataUrl == null || !dataUrl.startsWith("data:image/")) {
            return null;
        }
        try {
            int comma = dataUrl.indexOf(',');
            if (comma < 0) return null;
            byte[] bytes = Base64.getDecoder().decode(dataUrl.substring(comma + 1));
            return Image.getInstance(bytes);
        } catch (Throwable e) {
            // Throwable — chunki katta/buzuq imzo OutOfMemoryError (Error) berishi mumkin,
            // bu esa imzosiz chiziqqa graceful fallback bo'lishi kerak, so'rovni yiqitmasligi kerak.
            log.warn("Mijoz imzosini PDF'ga joylab bo'lmadi ({}): {}",
                    e.getClass().getSimpleName(), e.getMessage());
            return null;
        }
    }

    private String money(BigDecimal v) {
        if (v == null) return "0 so'm";
        NumberFormat nf = NumberFormat.getInstance(new Locale("uz"));
        return nf.format(v) + " so'm";
    }

    private String safe(String s) {
        return s != null ? s : "—";
    }
}
