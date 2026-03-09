package uz.jalyuziepr.api.service;

import org.springframework.stereotype.Service;
import uz.jalyuziepr.api.entity.OrderItem;
import uz.jalyuziepr.api.entity.Product;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Collection;

@Service
public class OrderPriceCalculationService {

    /**
     * Bitta item uchun narx hisoblash
     */
    public void calculateItemPrice(OrderItem item, Product product) {
        BigDecimal unitPrice;
        BigDecimal calculatedSqm = null;

        if (item.getWidthMm() != null && item.getHeightMm() != null && product.getPricePerSquareMeter() != null) {
            // Kvadrat metr bo'yicha hisoblash
            calculatedSqm = BigDecimal.valueOf(item.getWidthMm())
                    .multiply(BigDecimal.valueOf(item.getHeightMm()))
                    .divide(BigDecimal.valueOf(1_000_000), 4, RoundingMode.HALF_UP);
            unitPrice = product.getPricePerSquareMeter()
                    .multiply(calculatedSqm)
                    .setScale(2, RoundingMode.HALF_UP);
        } else {
            unitPrice = item.getUnitPrice() != null ? item.getUnitPrice() : product.getSellingPrice();
        }

        item.setCalculatedSqm(calculatedSqm);
        item.setUnitPrice(unitPrice);

        // Material narxi
        int qty = item.getQuantity() != null ? item.getQuantity() : 1;
        BigDecimal materialPrice = unitPrice.multiply(BigDecimal.valueOf(qty));

        // O'rnatish narxi
        BigDecimal installPrice = BigDecimal.ZERO;
        if (Boolean.TRUE.equals(item.getInstallationIncluded()) && product.getInstallationPrice() != null) {
            installPrice = product.getInstallationPrice().multiply(BigDecimal.valueOf(qty));
        }
        item.setInstallationPrice(installPrice);

        // Chegirma
        BigDecimal discount = item.getDiscount() != null ? item.getDiscount() : BigDecimal.ZERO;
        item.setDiscount(discount);

        // Jami
        BigDecimal totalPrice = materialPrice.add(installPrice).subtract(discount);
        item.setTotalPrice(totalPrice);

        // Tannarx snapshot
        if (product.getPurchasePrice() != null) {
            item.setCostPrice(product.getPurchasePrice());
        }
    }

    /**
     * Buyurtma jami narxlarini hisoblash
     */
    public OrderTotals calculateOrderTotals(Collection<OrderItem> items, BigDecimal discountAmount, BigDecimal discountPercent) {
        BigDecimal subtotal = items.stream()
                .map(OrderItem::getTotalPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal costTotal = items.stream()
                .filter(item -> item.getCostPrice() != null)
                .map(item -> item.getCostPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal effectiveDiscount = discountAmount != null ? discountAmount : BigDecimal.ZERO;
        if (discountPercent != null && discountPercent.compareTo(BigDecimal.ZERO) > 0) {
            effectiveDiscount = subtotal.multiply(discountPercent)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        }

        BigDecimal totalAmount = subtotal.subtract(effectiveDiscount);

        return new OrderTotals(subtotal, effectiveDiscount, totalAmount, costTotal);
    }

    public record OrderTotals(BigDecimal subtotal, BigDecimal discountAmount,
                               BigDecimal totalAmount, BigDecimal costTotal) {
    }
}
