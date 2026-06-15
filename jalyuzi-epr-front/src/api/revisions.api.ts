import api from './axios';

export type RevisionStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface RemeasureQuote {
  oldWidthMm?: number;
  oldHeightMm?: number;
  oldTotalPrice: number;
  newWidthMm: number;
  newHeightMm: number;
  newCalculatedSqm?: number;
  newUnitPrice?: number;
  newTotalPrice: number;
  delta: number;
}

export interface OrderItemRevision {
  id: number;
  orderId: number;
  orderNumber: string;
  orderItemId: number;
  productName?: string;
  roomName?: string;
  oldWidthMm?: number;
  oldHeightMm?: number;
  oldTotalPrice: number;
  newWidthMm: number;
  newHeightMm: number;
  newTotalPrice: number;
  delta: number;
  status: RevisionStatus;
  note?: string;
  requestedBy?: number;
  requestedByName?: string;
  createdAt: string;
  decidedByName?: string;
  decisionNote?: string;
  decidedAt?: string;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export const revisionsApi = {
  quote: async (
    orderId: number,
    itemId: number,
    payload: { widthMm: number; heightMm: number },
  ): Promise<RemeasureQuote> => {
    const { data } = await api.post<ApiResponse<RemeasureQuote>>(
      `/v1/orders/${orderId}/items/${itemId}/remeasure-quote`,
      payload,
    );
    return data.data;
  },

  request: async (
    orderId: number,
    itemId: number,
    payload: { widthMm: number; heightMm: number; note?: string },
  ): Promise<OrderItemRevision> => {
    const { data } = await api.post<ApiResponse<OrderItemRevision>>(
      `/v1/orders/${orderId}/items/${itemId}/remeasure`,
      payload,
    );
    return data.data;
  },

  getByOrder: async (orderId: number): Promise<OrderItemRevision[]> => {
    const { data } = await api.get<ApiResponse<OrderItemRevision[]>>(
      `/v1/orders/${orderId}/revisions`,
    );
    return data.data;
  },

  getPending: async (): Promise<OrderItemRevision[]> => {
    const { data } = await api.get<ApiResponse<OrderItemRevision[]>>('/v1/order-revisions');
    return data.data;
  },

  pendingCount: async (): Promise<number> => {
    const { data } = await api.get<ApiResponse<{ count: number }>>(
      '/v1/order-revisions/pending-count',
    );
    return data.data.count;
  },

  approve: async (id: number, note?: string): Promise<OrderItemRevision> => {
    const params = note ? `?note=${encodeURIComponent(note)}` : '';
    const { data } = await api.post<ApiResponse<OrderItemRevision>>(
      `/v1/order-revisions/${id}/approve${params}`,
    );
    return data.data;
  },

  reject: async (id: number, note?: string): Promise<OrderItemRevision> => {
    const params = note ? `?note=${encodeURIComponent(note)}` : '';
    const { data } = await api.post<ApiResponse<OrderItemRevision>>(
      `/v1/order-revisions/${id}/reject${params}`,
    );
    return data.data;
  },
};
