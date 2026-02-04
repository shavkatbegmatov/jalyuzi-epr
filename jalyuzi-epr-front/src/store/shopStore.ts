import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ShopProduct, ShopCustomer, ShopPriceCalculateResponse } from '../api/shop.api';

// ==================== CART ITEM ====================

export interface CartItem {
  id: string; // Unique ID for cart item
  product: ShopProduct;
  width: number;
  height: number;
  quantity: number;
  controlType?: string;
  notes?: string;
  priceInfo: ShopPriceCalculateResponse;
}

// ==================== SHOP STATE ====================

interface ShopState {
  // Language
  language: 'uz' | 'ru';
  setLanguage: (lang: 'uz' | 'ru') => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemsCount: () => number;

  // Auth
  customer: ShopCustomer | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (customer: ShopCustomer, accessToken: string, refreshToken: string) => void;
  logout: () => void;

  // UI
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;
}

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      // Language
      language: 'uz',
      setLanguage: (lang) => {
        set({ language: lang });
        localStorage.setItem('shop-language', lang);
      },

      // Cart
      cart: [],
      addToCart: (item) => {
        const id = `${item.product.id}-${item.width}-${item.height}-${Date.now()}`;
        set((state) => ({
          cart: [...state.cart, { ...item, id }],
        }));
      },
      removeFromCart: (id) => {
        set((state) => ({
          cart: state.cart.filter((item) => item.id !== id),
        }));
      },
      updateCartItem: (id, updates) => {
        set((state) => ({
          cart: state.cart.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + item.priceInfo.grandTotal, 0);
      },
      getCartItemsCount: () => {
        const { cart } = get();
        return cart.reduce((count, item) => count + item.quantity, 0);
      },

      // Auth
      customer: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      setAuth: (customer, accessToken, refreshToken) => {
        localStorage.setItem('shopAccessToken', accessToken);
        localStorage.setItem('shopRefreshToken', refreshToken);
        set({
          customer,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },
      logout: () => {
        localStorage.removeItem('shopAccessToken');
        localStorage.removeItem('shopRefreshToken');
        set({
          customer: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // UI
      isCartOpen: false,
      setCartOpen: (open) => set({ isCartOpen: open }),
    }),
    {
      name: 'shop-storage',
      partialize: (state) => ({
        language: state.language,
        cart: state.cart,
        customer: state.customer,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
