import api from './axios';
import type { ApiResponse } from '../types';

export type PaymentScheduleStatus =
  | 'PENDING'
  | 'PARTIAL'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface PaymentSchedule {
  id: number;
  orderId: number;
  sequenceNo: number;
  label: string;
  percentage?: number;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  status: PaymentScheduleStatus;
  statusDisplayName: string;
  paidAt?: string;
  paidAmount: number;
  remainingAmount: number;
  paymentId?: number;
  notes?: string;
  overdue: boolean;
  daysUntilDue: number;
}

export interface PaymentScheduleItem {
  sequenceNo: number;
  label: string;
  percentage?: number;
  amount: number;
  dueDate: string;
  notes?: string;
}

export const paymentSchedulesApi = {
  getByOrder: async (orderId: number): Promise<PaymentSchedule[]> => {
    const res = await api.get<ApiResponse<PaymentSchedule[]>>(
      `/v1/orders/${orderId}/payment-schedules`,
    );
    return res.data.data;
  },

  createBulk: async (orderId: number, items: PaymentScheduleItem[]): Promise<PaymentSchedule[]> => {
    const res = await api.post<ApiResponse<PaymentSchedule[]>>(
      `/v1/orders/${orderId}/payment-schedules`,
      { items },
    );
    return res.data.data;
  },

  createStandard: async (orderId: number): Promise<PaymentSchedule[]> => {
    const res = await api.post<ApiResponse<PaymentSchedule[]>>(
      `/v1/orders/${orderId}/payment-schedules/standard`,
    );
    return res.data.data;
  },

  cancel: async (orderId: number, scheduleId: number, reason: string): Promise<void> => {
    await api.post(`/v1/orders/${orderId}/payment-schedules/${scheduleId}/cancel`, { reason });
  },
};
