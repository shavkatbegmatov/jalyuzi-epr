import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Save, Ruler } from 'lucide-react';
import toast from 'react-hot-toast';
import { ordersApi } from '../../api/orders.api';
import { productsApi } from '../../api/products.api';
import type { Order, OrderMeasurementItem, Product } from '../../types';

interface MeasurementRow {
  productId: number;
  productName: string;
  roomName: string;
  widthMm: number | '';
  heightMm: number | '';
  depthMm: number | '';
  quantity: number;
  installationIncluded: boolean;
  calculatedSqm: number | null;
  pricePerSqm: number | null;
  sellingPrice: number;
}

export function MeasurementFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [rows, setRows] = useState<MeasurementRow[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);

  const loadOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await ordersApi.getById(Number(id));
      setOrder(data);
      // Pre-fill from existing items
      if (data.items && data.items.length > 0) {
        setRows(data.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          roomName: item.roomName || '',
          widthMm: item.widthMm || '',
          heightMm: item.heightMm || '',
          depthMm: item.depthMm || '',
          quantity: item.quantity,
          installationIncluded: item.installationIncluded,
          calculatedSqm: item.calculatedSqm || null,
          pricePerSqm: null,
          sellingPrice: item.unitPrice,
        })));
      }
    } catch {
      toast.error("Buyurtma yuklanmadi");
      navigate('/orders');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const searchProducts = useCallback(async (search: string) => {
    if (search.length < 2) { setProducts([]); return; }
    try {
      const res = await productsApi.getAll({ search, page: 0, size: 10 });
      setProducts(res.content);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(productSearch), 300);
    return () => clearTimeout(timer);
  }, [productSearch, searchProducts]);

  const addProduct = (product: Product) => {
    setRows(prev => [...prev, {
      productId: product.id,
      productName: product.name,
      roomName: '',
      widthMm: '',
      heightMm: '',
      depthMm: '',
      quantity: 1,
      installationIncluded: false,
      calculatedSqm: null,
      pricePerSqm: product.pricePerSquareMeter || null,
      sellingPrice: product.sellingPrice,
    }]);
    setShowProductPicker(false);
    setProductSearch('');
  };

  const removeRow = (index: number) => {
    setRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof MeasurementRow, value: unknown) => {
    setRows(prev => prev.map((row, i) => {
      if (i !== index) return row;
      const updated = { ...row, [field]: value };
      // Recalculate sqm
      const w = typeof updated.widthMm === 'number' ? updated.widthMm : 0;
      const h = typeof updated.heightMm === 'number' ? updated.heightMm : 0;
      if (w > 0 && h > 0) {
        updated.calculatedSqm = Math.round((w * h) / 10000) / 100; // m²
      } else {
        updated.calculatedSqm = null;
      }
      return updated;
    }));
  };

  const handleSubmit = async () => {
    if (rows.length === 0) {
      toast.error("Kamida bitta o'lchov kiritish kerak");
      return;
    }

    for (const row of rows) {
      if (!row.widthMm || !row.heightMm) {
        toast.error(`${row.productName} uchun o'lcham kiritilmagan`);
        return;
      }
    }

    try {
      setSaving(true);
      const items: OrderMeasurementItem[] = rows.map(row => ({
        productId: row.productId,
        roomName: row.roomName || undefined,
        widthMm: typeof row.widthMm === 'number' ? row.widthMm : undefined,
        heightMm: typeof row.heightMm === 'number' ? row.heightMm : undefined,
        depthMm: typeof row.depthMm === 'number' ? row.depthMm : undefined,
        quantity: row.quantity,
        installationIncluded: row.installationIncluded,
      }));

      await ordersApi.submitMeasurements(Number(id), { items, notes: notes || undefined });
      toast.success("O'lchov natijalari saqlandi");
      navigate(`/orders/${id}`);
    } catch {
      toast.error("Saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/orders/${id}`)}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-xl font-bold">O'lchov kiritish</h1>
            <p className="text-sm text-base-content/60">
              Buyurtma: {order.orderNumber} | Mijoz: {order.customerName}
            </p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
          {saving ? <span className="loading loading-spinner loading-sm" /> : <Save className="h-4 w-4" />}
          Saqlash
        </button>
      </div>

      {/* Address info */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <p className="text-sm"><strong>Manzil:</strong> {order.installationAddress || 'Belgilanmagan'}</p>
          <p className="text-sm"><strong>Telefon:</strong> {order.customerPhone}</p>
        </div>
      </div>

      {/* Measurement rows */}
      <div className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-primary" />
                  <span className="font-medium">{row.productName}</span>
                </div>
                <button className="btn btn-ghost btn-sm text-error" onClick={() => removeRow(index)}>
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                <div>
                  <label className="label py-1"><span className="label-text text-xs">Xona nomi</span></label>
                  <input
                    type="text"
                    className="input input-bordered input-sm w-full"
                    placeholder="Masalan: Yotoqxona"
                    value={row.roomName}
                    onChange={e => updateRow(index, 'roomName', e.target.value)}
                  />
                </div>
                <div>
                  <label className="label py-1"><span className="label-text text-xs">Kenglik (mm)</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    placeholder="mm"
                    value={row.widthMm}
                    onChange={e => updateRow(index, 'widthMm', e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="label py-1"><span className="label-text text-xs">Balandlik (mm)</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    placeholder="mm"
                    value={row.heightMm}
                    onChange={e => updateRow(index, 'heightMm', e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="label py-1"><span className="label-text text-xs">Chuqurlik (mm)</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    placeholder="mm"
                    value={row.depthMm}
                    onChange={e => updateRow(index, 'depthMm', e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div>
                  <label className="label py-1"><span className="label-text text-xs">Soni</span></label>
                  <input
                    type="number"
                    className="input input-bordered input-sm w-full"
                    min={1}
                    value={row.quantity}
                    onChange={e => updateRow(index, 'quantity', Math.max(1, Number(e.target.value)))}
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="label cursor-pointer gap-2">
                    <input
                      type="checkbox"
                      className="checkbox checkbox-sm checkbox-primary"
                      checked={row.installationIncluded}
                      onChange={e => updateRow(index, 'installationIncluded', e.target.checked)}
                    />
                    <span className="label-text text-xs">O'rnatish</span>
                  </label>
                </div>
              </div>

              {row.calculatedSqm && (
                <div className="mt-2 text-sm text-base-content/60">
                  Maydon: <strong>{row.calculatedSqm.toFixed(2)} m²</strong>
                  {row.pricePerSqm && (
                    <> | Taxminiy narx: <strong>{new Intl.NumberFormat('uz-UZ').format(row.pricePerSqm * row.calculatedSqm * row.quantity)} so'm</strong></>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add product */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          {showProductPicker ? (
            <div className="space-y-3">
              <input
                type="text"
                className="input input-bordered w-full"
                placeholder="Mahsulot qidirish..."
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                autoFocus
              />
              {products.length > 0 && (
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {products.map(p => (
                    <button
                      key={p.id}
                      className="w-full text-left p-2 rounded-lg hover:bg-base-200 flex justify-between items-center"
                      onClick={() => addProduct(p)}
                    >
                      <div>
                        <div className="font-medium text-sm">{p.name}</div>
                        <div className="text-xs text-base-content/60">{p.sku}</div>
                      </div>
                      <div className="text-sm font-medium">
                        {p.pricePerSquareMeter
                          ? `${new Intl.NumberFormat('uz-UZ').format(p.pricePerSquareMeter)} so'm/m²`
                          : `${new Intl.NumberFormat('uz-UZ').format(p.sellingPrice)} so'm`
                        }
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <button className="btn btn-ghost btn-sm" onClick={() => { setShowProductPicker(false); setProductSearch(''); }}>
                Bekor qilish
              </button>
            </div>
          ) : (
            <button className="btn btn-outline btn-primary w-full" onClick={() => setShowProductPicker(true)}>
              <Plus className="h-4 w-4" /> Mahsulot qo'shish
            </button>
          )}
        </div>
      </div>

      {/* Notes */}
      <div className="card bg-base-100 shadow-sm">
        <div className="card-body p-4">
          <label className="label"><span className="label-text font-medium">Izohlar</span></label>
          <textarea
            className="textarea textarea-bordered w-full"
            placeholder="O'lchov bo'yicha izohlar..."
            rows={3}
            value={notes}
            onChange={e => setNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
