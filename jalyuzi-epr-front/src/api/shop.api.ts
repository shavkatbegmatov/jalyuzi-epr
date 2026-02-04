import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Shop uchun alohida axios instance (token'siz ham ishlashi uchun)
const shopApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shop token (customer token)
shopApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('shopAccessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ==================== TYPES ====================

export interface ShopProduct {
  id: number;
  sku: string;
  name: string;
  description: string;
  brandId: number;
  brandName: string;
  categoryId: number;
  categoryName: string;
  blindType: string;
  blindTypeName: string;
  material: string;
  materialName: string;
  color: string;
  controlType: string;
  controlTypeName: string;
  productTypeId: number;
  productTypeCode: string;
  productTypeName: string;
  attributes: Record<string, unknown>;
  minWidth: number;
  maxWidth: number;
  minHeight: number;
  maxHeight: number;
  pricePerSquareMeter: number;
  installationPrice: number;
  basePrice: number;
  imageUrl: string;
  galleryImages: string[];
  inStock: boolean;
  collection: string;
}

export interface ShopCategory {
  id: number;
  name: string;
  description: string;
  productCount: number;
}

export interface ShopBrand {
  id: number;
  name: string;
  description: string;
  logoUrl: string;
  productCount: number;
}

export interface ShopBlindType {
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  productCount: number;
}

export interface ShopMaterial {
  code: string;
  name: string;
  description: string;
  productCount: number;
}

export interface ShopProductFilter {
  search?: string;
  categoryId?: number;
  brandId?: number;
  blindTypes?: string[];
  materials?: string[];
  controlTypes?: string[];
  colors?: string[];
  sortBy?: 'price' | 'name' | 'newest';
  sortDirection?: 'asc' | 'desc';
  inStockOnly?: boolean;
  page?: number;
  size?: number;
}

export interface ShopPriceCalculateRequest {
  productId: number;
  width: number;
  height: number;
  controlType?: string;
  withInstallation?: boolean;
  quantity?: number;
}

export interface ShopPriceCalculateResponse {
  width: number;
  height: number;
  squareMeters: number;
  productPrice: number;
  installationPrice: number;
  unitTotal: number;
  quantity: number;
  subtotal: number;
  installationTotal: number;
  grandTotal: number;
  productName: string;
  blindTypeName: string;
  materialName: string;
  controlTypeName: string;
  validDimensions: boolean;
  dimensionError: string;
}

export interface ShopCustomer {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  companyName: string;
}

export interface ShopAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  customer: ShopCustomer;
}

export interface ShopOrderItem {
  productId: number;
  width: number;
  height: number;
  controlType?: string;
  quantity: number;
  notes?: string;
}

export interface ShopOrderRequest {
  items: ShopOrderItem[];
  customerName?: string;
  customerPhone?: string;
  deliveryAddress: string;
  withInstallation?: boolean;
  preferredInstallationDate?: string;
  installationNotes?: string;
  paymentMethod: 'CASH' | 'CARD' | 'TRANSFER' | 'DEBT';
  notes?: string;
}

export interface ShopOrderItemResponse {
  id: number;
  productId: number;
  productName: string;
  productSku: string;
  blindTypeName: string;
  materialName: string;
  color: string;
  controlType: string;
  controlTypeName: string;
  width: number;
  height: number;
  squareMeters: number;
  unitPrice: number;
  installationPrice: number;
  quantity: number;
  totalPrice: number;
  notes: string;
  imageUrl: string;
}

export interface ShopOrderResponse {
  id: number;
  orderNumber: string;
  orderDate: string;
  status: string;
  statusName: string;
  paymentStatus: string;
  paymentStatusName: string;
  items: ShopOrderItemResponse[];
  subtotal: number;
  installationTotal: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMethod: string;
  paymentMethodName: string;
  deliveryAddress: string;
  withInstallation: boolean;
  installationDate: string;
  installationNotes: string;
  notes: string;
  createdAt: string;
}

export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

// ==================== CATALOG API ====================

export const shopCatalogApi = {
  getProducts: async (filter: ShopProductFilter = {}): Promise<PagedResponse<ShopProduct>> => {
    const params = new URLSearchParams();
    if (filter.search) params.append('search', filter.search);
    if (filter.categoryId) params.append('categoryId', filter.categoryId.toString());
    if (filter.brandId) params.append('brandId', filter.brandId.toString());
    if (filter.blindTypes?.length) filter.blindTypes.forEach(t => params.append('blindTypes', t));
    if (filter.materials?.length) filter.materials.forEach(m => params.append('materials', m));
    if (filter.controlTypes?.length) filter.controlTypes.forEach(c => params.append('controlTypes', c));
    if (filter.colors?.length) filter.colors.forEach(c => params.append('colors', c));
    if (filter.sortBy) params.append('sortBy', filter.sortBy);
    if (filter.sortDirection) params.append('sortDirection', filter.sortDirection);
    if (filter.inStockOnly) params.append('inStockOnly', 'true');
    if (filter.page !== undefined) params.append('page', filter.page.toString());
    if (filter.size) params.append('size', filter.size.toString());

    const response = await shopApi.get<ApiResponse<PagedResponse<ShopProduct>>>(`/v1/shop/products?${params}`);
    return response.data.data;
  },

  getProduct: async (id: number): Promise<ShopProduct> => {
    const response = await shopApi.get<ApiResponse<ShopProduct>>(`/v1/shop/products/${id}`);
    return response.data.data;
  },

  getCategories: async (): Promise<ShopCategory[]> => {
    const response = await shopApi.get<ApiResponse<ShopCategory[]>>('/v1/shop/categories');
    return response.data.data;
  },

  getBrands: async (): Promise<ShopBrand[]> => {
    const response = await shopApi.get<ApiResponse<ShopBrand[]>>('/v1/shop/brands');
    return response.data.data;
  },

  getBlindTypes: async (): Promise<ShopBlindType[]> => {
    const response = await shopApi.get<ApiResponse<ShopBlindType[]>>('/v1/shop/blind-types');
    return response.data.data;
  },

  getMaterials: async (): Promise<ShopMaterial[]> => {
    const response = await shopApi.get<ApiResponse<ShopMaterial[]>>('/v1/shop/materials');
    return response.data.data;
  },

  calculatePrice: async (request: ShopPriceCalculateRequest): Promise<ShopPriceCalculateResponse> => {
    const response = await shopApi.post<ApiResponse<ShopPriceCalculateResponse>>('/v1/shop/calculate-price', request);
    return response.data.data;
  },
};

// ==================== AUTH API ====================

export const shopAuthApi = {
  sendCode: async (phone: string): Promise<string> => {
    const response = await shopApi.post<ApiResponse<string>>('/v1/shop/auth/send-code', { phone });
    return response.data.message;
  },

  verifyCode: async (phone: string, code: string): Promise<boolean> => {
    const response = await shopApi.post<ApiResponse<boolean>>('/v1/shop/auth/verify-code', { phone, code });
    return response.data.success;
  },

  register: async (phone: string, code: string, fullName: string, address?: string): Promise<ShopAuthResponse> => {
    const response = await shopApi.post<ApiResponse<ShopAuthResponse>>('/v1/shop/auth/register', {
      phone,
      code,
      fullName,
      address,
    });
    return response.data.data;
  },

  login: async (phone: string, code: string): Promise<ShopAuthResponse> => {
    const response = await shopApi.post<ApiResponse<ShopAuthResponse>>('/v1/shop/auth/login', { phone, code });
    return response.data.data;
  },
};

// ==================== ORDER API ====================

export const shopOrderApi = {
  createOrder: async (request: ShopOrderRequest): Promise<ShopOrderResponse> => {
    const response = await shopApi.post<ApiResponse<ShopOrderResponse>>('/v1/shop/orders', request);
    return response.data.data;
  },

  getOrders: async (page = 0, size = 10): Promise<PagedResponse<ShopOrderResponse>> => {
    const response = await shopApi.get<ApiResponse<PagedResponse<ShopOrderResponse>>>(`/v1/shop/orders?page=${page}&size=${size}`);
    return response.data.data;
  },

  getOrder: async (id: number): Promise<ShopOrderResponse> => {
    const response = await shopApi.get<ApiResponse<ShopOrderResponse>>(`/v1/shop/orders/${id}`);
    return response.data.data;
  },

  getProfile: async (): Promise<ShopCustomer> => {
    const response = await shopApi.get<ApiResponse<ShopCustomer>>('/v1/shop/profile');
    return response.data.data;
  },
};
