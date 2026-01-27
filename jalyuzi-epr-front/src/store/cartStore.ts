import { create } from 'zustand';
import type { CartItem, Customer, Product } from '../types';

interface CartState {
  items: CartItem[];
  customer: Customer | null;
  discount: number;
  discountPercent: number;

  // O'rnatish maydonlari
  installationEnabled: boolean;
  installationDate: string | null;
  installationAddress: string;
  installationNotes: string;
  technicianId: number | null;

  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  updateItemDiscount: (productId: number, discount: number) => void;
  setCustomer: (customer: Customer | null) => void;
  setDiscount: (discount: number) => void;
  setDiscountPercent: (percent: number) => void;
  clear: () => void;

  // O'rnatish metodlari
  setInstallationEnabled: (enabled: boolean) => void;
  setInstallationDate: (date: string | null) => void;
  setInstallationAddress: (address: string) => void;
  setInstallationNotes: (notes: string) => void;
  setTechnicianId: (id: number | null) => void;
  clearInstallation: () => void;

  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customer: null,
  discount: 0,
  discountPercent: 0,

  // O'rnatish maydonlari
  installationEnabled: false,
  installationDate: null,
  installationAddress: '',
  installationNotes: '',
  technicianId: null,

  addItem: (product, quantity = 1) => {
    set((state) => {
      const existing = state.items.find((i) => i.product.id === product.id);
      if (existing) {
        const newQuantity = existing.quantity + quantity;
        if (newQuantity > product.quantity) {
          return state; // Can't add more than available
        }
        return {
          items: state.items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: newQuantity }
              : i
          ),
        };
      }
      if (quantity > product.quantity) {
        return state;
      }
      return {
        items: [...state.items, { product, quantity, discount: 0 }],
      };
    });
  },

  removeItem: (productId) => {
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    }));
  },

  updateQuantity: (productId, quantity) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
      ),
    }));
  },

  updateItemDiscount: (productId, discount) => {
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, discount } : i
      ),
    }));
  },

  setCustomer: (customer) => set({ customer }),

  setDiscount: (discount) => set({ discount, discountPercent: 0 }),

  setDiscountPercent: (discountPercent) => set({ discountPercent, discount: 0 }),

  clear: () =>
    set({
      items: [],
      customer: null,
      discount: 0,
      discountPercent: 0,
      installationEnabled: false,
      installationDate: null,
      installationAddress: '',
      installationNotes: '',
      technicianId: null,
    }),

  // O'rnatish metodlari
  setInstallationEnabled: (enabled) => set({ installationEnabled: enabled }),
  setInstallationDate: (date) => set({ installationDate: date }),
  setInstallationAddress: (address) => set({ installationAddress: address }),
  setInstallationNotes: (notes) => set({ installationNotes: notes }),
  setTechnicianId: (id) => set({ technicianId: id }),
  clearInstallation: () =>
    set({
      installationEnabled: false,
      installationDate: null,
      installationAddress: '',
      installationNotes: '',
      technicianId: null,
    }),

  getSubtotal: () => {
    const { items } = get();
    return items.reduce(
      (sum, item) =>
        sum + item.product.sellingPrice * item.quantity - item.discount,
      0
    );
  },

  getDiscountAmount: () => {
    const { discount, discountPercent } = get();
    if (discount > 0) return discount;
    if (discountPercent > 0) {
      return get().getSubtotal() * (discountPercent / 100);
    }
    return 0;
  },

  getTotal: () => {
    return get().getSubtotal() - get().getDiscountAmount();
  },

  getItemCount: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
