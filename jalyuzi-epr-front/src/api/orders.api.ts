import api from './axios';
import type {
  Order,
  OrderCreateRequest,
  OrderMeasurementRequest,
  OrderAssignRequest,
  OrderPaymentRequest,
  OrderStatsResponse,
} from '../types';

interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export const ordersApi = {
  // Query
  getAll: async (params: {
    status?: string;
    search?: string;
    page?: number;
    size?: number;
    sort?: string;
  }): Promise<PagedResponse<Order>> => {
    const searchParams = new URLSearchParams();
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    if (params.page !== undefined) searchParams.append('page', String(params.page));
    if (params.size !== undefined) searchParams.append('size', String(params.size));
    if (params.sort) searchParams.append('sort', params.sort);
    const { data } = await api.get<ApiResponse<PagedResponse<Order>>>(
      `/v1/orders?${searchParams.toString()}`
    );
    return data.data;
  },

  getById: async (id: number): Promise<Order> => {
    const { data } = await api.get<ApiResponse<Order>>(`/v1/orders/${id}`);
    return data.data;
  },

  getStats: async (): Promise<OrderStatsResponse> => {
    const { data } = await api.get<ApiResponse<OrderStatsResponse>>('/v1/orders/stats');
    return data.data;
  },

  getInstallerOrders: async (): Promise<Order[]> => {
    const { data } = await api.get<ApiResponse<Order[]>>('/v1/orders/installer/my');
    return data.data;
  },

  // Lifecycle
  create: async (request: OrderCreateRequest): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>('/v1/orders', request);
    return data.data;
  },

  assignMeasurer: async (id: number, request: OrderAssignRequest): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/assign-measurer`, request);
    return data.data;
  },

  submitMeasurements: async (id: number, request: OrderMeasurementRequest): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/measurements`, request);
    return data.data;
  },

  confirmPrice: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/confirm-price${params}`);
    return data.data;
  },

  receiveDeposit: async (id: number, request: OrderPaymentRequest): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/deposit`, request);
    return data.data;
  },

  startProduction: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/start-production${params}`);
    return data.data;
  },

  completeProduction: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/complete-production${params}`);
    return data.data;
  },

  assignInstaller: async (id: number, request: OrderAssignRequest): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/assign-installer`, request);
    return data.data;
  },

  startInstallation: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/start-installation${params}`);
    return data.data;
  },

  completeInstallation: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/complete-installation${params}`);
    return data.data;
  },

  collectPayment: async (id: number, request: OrderPaymentRequest): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/collect-payment`, request);
    return data.data;
  },

  confirmPayment: async (paymentId: number): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/payments/${paymentId}/confirm`);
    return data.data;
  },

  finalizeOrder: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/finalize${params}`);
    return data.data;
  },

  transferToDebt: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/transfer-to-debt${params}`);
    return data.data;
  },

  cancelOrder: async (id: number, notes?: string): Promise<Order> => {
    const params = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/cancel${params}`);
    return data.data;
  },

  addPayment: async (id: number, request: OrderPaymentRequest): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/add-payment`, request);
    return data.data;
  },

  revertStatus: async (id: number, request: { targetStatus: string; reason: string }): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/v1/orders/${id}/revert`, request);
    return data.data;
  },
};
