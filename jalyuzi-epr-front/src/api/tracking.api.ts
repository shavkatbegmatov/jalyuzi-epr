import axios from 'axios';
import { API_BASE_URL } from '../config/constants';

// Auth interceptorsiz TOZA instance — ommaviy kuzatuv sahifasi hech qachon
// login/refresh oqimiga tushmasligi kerak (foydalanuvchi tizimga kirmagan).
const publicApi = axios.create({ baseURL: API_BASE_URL });

export interface TrackingItem {
  productName?: string;
  roomName?: string;
  widthMm?: number;
  heightMm?: number;
  quantity?: number;
}

export interface TrackingTimelineEntry {
  status: string;
  statusLabel: string;
  at: string;
}

export interface OrderTracking {
  orderNumber: string;
  customerName?: string;
  status: string;
  statusLabel: string;
  cancelled: boolean;
  completed: boolean;
  stageIndex: number;
  totalStages: number;
  progressPercent: number;
  createdAt?: string;
  measurementDate?: string;
  productionStartDate?: string;
  productionEndDate?: string;
  installationDate?: string;
  completedDate?: string;
  measurerName?: string;
  installerName?: string;
  totalAmount?: number;
  paidAmount?: number;
  remainingAmount?: number;
  items: TrackingItem[];
  timeline: TrackingTimelineEntry[];
  photosBefore: string[];
  photosAfter: string[];
  telegramSubscribeUrl?: string;
  reviewRating?: number | null;
  reviewComment?: string | null;
  reviewable: boolean;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp: string;
}

export const trackingApi = {
  get: async (code: string): Promise<OrderTracking> => {
    const { data } = await publicApi.get<ApiResponse<OrderTracking>>(
      `/v1/track/${encodeURIComponent(code)}`
    );
    return data.data;
  },

  submitReview: async (
    code: string,
    rating: number,
    comment?: string,
  ): Promise<OrderTracking> => {
    const { data } = await publicApi.post<ApiResponse<OrderTracking>>(
      `/v1/track/${encodeURIComponent(code)}/review`,
      { rating, comment },
    );
    return data.data;
  },
};
