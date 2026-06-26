import api from './axios';
import type { ApiResponse, PaymentMethod, PaymentMethodSetting } from '../types';

export interface PaymentMethodUpdateItem {
  code: PaymentMethod;
  label: string;
  enabled: boolean;
  shopEnabled: boolean;
  sortOrder: number;
}

export const paymentMethodsApi = {
  getAll: async (): Promise<PaymentMethodSetting[]> => {
    const response = await api.get<ApiResponse<PaymentMethodSetting[]>>('/v1/payment-methods');
    return response.data.data;
  },

  update: async (methods: PaymentMethodUpdateItem[]): Promise<PaymentMethodSetting[]> => {
    const response = await api.put<ApiResponse<PaymentMethodSetting[]>>('/v1/payment-methods', { methods });
    return response.data.data;
  },
};
