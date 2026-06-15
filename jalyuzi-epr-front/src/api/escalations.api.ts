import api from './axios';

export type EscalationReason =
  | 'WRONG_MEASUREMENT'
  | 'MISSING_PART'
  | 'DEFECTIVE_ITEM'
  | 'CUSTOMER_DISPUTE'
  | 'ACCESS_ISSUE'
  | 'OTHER';

export type EscalationStatus = 'OPEN' | 'RESOLVED';

export interface OrderEscalation {
  id: number;
  orderId: number;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;
  installationAddress?: string;
  reason: EscalationReason;
  reasonLabel: string;
  description?: string;
  photoUrl?: string;
  status: EscalationStatus;
  createdBy?: number;
  createdByName?: string;
  createdAt: string;
  resolvedByName?: string;
  resolutionNote?: string;
  resolvedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

/** Sabab tanlash variantlari (UI uchun) */
export const ESCALATION_REASONS: { value: EscalationReason; label: string; emoji: string }[] = [
  { value: 'WRONG_MEASUREMENT', label: "Noto'g'ri o'lcham", emoji: '📐' },
  { value: 'MISSING_PART', label: 'Qism yetishmayapti', emoji: '🔩' },
  { value: 'DEFECTIVE_ITEM', label: 'Nuqsonli mahsulot', emoji: '🧩' },
  { value: 'CUSTOMER_DISPUTE', label: 'Mijoz bilan nizo', emoji: '🗣️' },
  { value: 'ACCESS_ISSUE', label: 'Kirishda muammo', emoji: '🚪' },
  { value: 'OTHER', label: 'Boshqa', emoji: '❓' },
];

export const escalationsApi = {
  create: async (
    orderId: number,
    payload: { reason: EscalationReason; description?: string; file?: File },
  ): Promise<OrderEscalation> => {
    const fd = new FormData();
    fd.append('reason', payload.reason);
    if (payload.description) fd.append('description', payload.description);
    if (payload.file) fd.append('file', payload.file);
    const { data } = await api.post<ApiResponse<OrderEscalation>>(
      `/v1/orders/${orderId}/escalations`,
      fd,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return data.data;
  },

  getByOrder: async (orderId: number): Promise<OrderEscalation[]> => {
    const { data } = await api.get<ApiResponse<OrderEscalation[]>>(
      `/v1/orders/${orderId}/escalations`,
    );
    return data.data;
  },

  getActive: async (): Promise<OrderEscalation[]> => {
    const { data } = await api.get<ApiResponse<OrderEscalation[]>>('/v1/escalations');
    return data.data;
  },

  activeCount: async (): Promise<number> => {
    const { data } = await api.get<ApiResponse<{ count: number }>>(
      '/v1/escalations/active-count',
    );
    return data.data.count;
  },

  resolve: async (id: number, note?: string): Promise<OrderEscalation> => {
    const params = note ? `?note=${encodeURIComponent(note)}` : '';
    const { data } = await api.post<ApiResponse<OrderEscalation>>(
      `/v1/escalations/${id}/resolve${params}`,
    );
    return data.data;
  },
};
