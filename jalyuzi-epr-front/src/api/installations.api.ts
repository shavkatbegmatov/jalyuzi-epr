import api from './axios';
import type { ApiResponse, Installation, InstallationRequest, InstallationStatus, PagedResponse } from '../types';
import { createExportApi } from './export.utils';

export interface InstallationFilters {
  page?: number;
  size?: number;
  technicianId?: number;
  status?: InstallationStatus;
  startDate?: string;
  endDate?: string;
}

export const installationsApi = {
  getAll: async (filters: InstallationFilters = {}): Promise<PagedResponse<Installation>> => {
    const params = new URLSearchParams();
    if (filters.page !== undefined) params.append('page', filters.page.toString());
    if (filters.size !== undefined) params.append('size', filters.size.toString());
    if (filters.technicianId) params.append('technicianId', filters.technicianId.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get<ApiResponse<PagedResponse<Installation>>>(`/v1/installations?${params}`);
    return response.data.data;
  },

  getById: async (id: number): Promise<Installation> => {
    const response = await api.get<ApiResponse<Installation>>(`/v1/installations/${id}`);
    return response.data.data;
  },

  getBySaleId: async (saleId: number): Promise<Installation[]> => {
    const response = await api.get<ApiResponse<Installation[]>>(`/v1/installations/sale/${saleId}`);
    return response.data.data;
  },

  getByTechnician: async (technicianId: number): Promise<Installation[]> => {
    const response = await api.get<ApiResponse<Installation[]>>(`/v1/installations/technician/${technicianId}`);
    return response.data.data;
  },

  getByDate: async (date: string): Promise<Installation[]> => {
    const response = await api.get<ApiResponse<Installation[]>>(`/v1/installations/date/${date}`);
    return response.data.data;
  },

  getSchedule: async (startDate: string, endDate: string, technicianId?: number): Promise<Installation[]> => {
    const params = new URLSearchParams();
    params.append('startDate', startDate);
    params.append('endDate', endDate);
    if (technicianId) params.append('technicianId', technicianId.toString());

    const response = await api.get<ApiResponse<Installation[]>>(`/v1/installations/schedule?${params}`);
    return response.data.data;
  },

  getUpcoming: async (): Promise<Installation[]> => {
    const response = await api.get<ApiResponse<Installation[]>>('/v1/installations/upcoming');
    return response.data.data;
  },

  create: async (data: InstallationRequest): Promise<Installation> => {
    const response = await api.post<ApiResponse<Installation>>('/v1/installations', data);
    return response.data.data;
  },

  update: async (id: number, data: InstallationRequest): Promise<Installation> => {
    const response = await api.put<ApiResponse<Installation>>(`/v1/installations/${id}`, data);
    return response.data.data;
  },

  updateStatus: async (id: number, status: InstallationStatus): Promise<Installation> => {
    const response = await api.patch<ApiResponse<Installation>>(
      `/v1/installations/${id}/status`,
      null,
      { params: { status } }
    );
    return response.data.data;
  },

  complete: async (id: number, completionNotes?: string, customerSignature?: string): Promise<Installation> => {
    const params = new URLSearchParams();
    if (completionNotes) params.append('completionNotes', completionNotes);
    if (customerSignature) params.append('customerSignature', customerSignature);

    const response = await api.patch<ApiResponse<Installation>>(
      `/v1/installations/${id}/complete?${params}`
    );
    return response.data.data;
  },

  cancel: async (id: number, reason: string): Promise<void> => {
    await api.patch(`/v1/installations/${id}/cancel`, null, { params: { reason } });
  },

  // Export functionality
  export: createExportApi('/v1/installations'),
};
