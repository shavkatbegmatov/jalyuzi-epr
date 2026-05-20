import api from './axios';
import type { ApiResponse } from '../types';

export type PhotoType = 'MEASUREMENT' | 'BEFORE' | 'AFTER';

export interface OrderPhotos {
  measurement: string[];
  before: string[];
  after: string[];
  signature: string[];
}

export const orderPhotosApi = {
  getAll: async (orderId: number): Promise<OrderPhotos> => {
    const res = await api.get<ApiResponse<OrderPhotos>>(`/v1/orders/${orderId}/photos`);
    return res.data.data;
  },

  upload: async (orderId: number, type: PhotoType, file: File): Promise<string[]> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post<ApiResponse<string[]>>(
      `/v1/orders/${orderId}/photos/${type}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return res.data.data;
  },

  delete: async (orderId: number, type: PhotoType, url: string): Promise<string[]> => {
    const res = await api.delete<ApiResponse<string[]>>(
      `/v1/orders/${orderId}/photos/${type}`,
      { params: { url } },
    );
    return res.data.data;
  },

  saveSignature: async (orderId: number, signature: string): Promise<string> => {
    const res = await api.post<ApiResponse<string>>(
      `/v1/orders/${orderId}/photos/signature`,
      { signature },
    );
    return res.data.data;
  },
};
