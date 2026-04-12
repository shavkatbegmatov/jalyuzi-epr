import api from './axios';
import type {
  ApiResponse,
  PagedResponse,
  Installer,
  InstallerDetail,
  InstallerStats,
  InstallerCreateRequest,
  InstallerUpdateRequest,
  Order,
} from '../types';

export interface InstallerFilters {
  page?: number;
  size?: number;
  search?: string;
}

export const installersApi = {
  getAll: async (filters: InstallerFilters = {}): Promise<PagedResponse<Installer>> => {
    const params = new URLSearchParams();
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.search) params.append('search', filters.search);

    const response = await api.get<ApiResponse<PagedResponse<Installer>>>(`/v1/installers?${params}`);
    return response.data.data;
  },

  getStats: async (): Promise<InstallerStats> => {
    const response = await api.get<ApiResponse<InstallerStats>>('/v1/installers/stats');
    return response.data.data;
  },

  getById: async (id: number): Promise<InstallerDetail> => {
    const response = await api.get<ApiResponse<InstallerDetail>>(`/v1/installers/${id}`);
    return response.data.data;
  },

  getOrders: async (id: number, page = 0, size = 10): Promise<PagedResponse<Order>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('size', size.toString());

    const response = await api.get<ApiResponse<PagedResponse<Order>>>(`/v1/installers/${id}/orders?${params}`);
    return response.data.data;
  },

  create: async (data: InstallerCreateRequest): Promise<Installer> => {
    const response = await api.post<ApiResponse<Installer>>('/v1/installers', data);
    return response.data.data;
  },

  update: async (id: number, data: InstallerUpdateRequest): Promise<Installer> => {
    const response = await api.put<ApiResponse<Installer>>(`/v1/installers/${id}`, data);
    return response.data.data;
  },

  toggleActive: async (id: number): Promise<Installer> => {
    const response = await api.patch<ApiResponse<Installer>>(`/v1/installers/${id}/toggle-active`);
    return response.data.data;
  },
};
