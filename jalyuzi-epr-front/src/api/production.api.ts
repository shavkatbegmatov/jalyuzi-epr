import api from './axios';
import type { ApiResponse } from '../types';

export type ProductionStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'ON_HOLD'
  | 'COMPLETED'
  | 'CANCELLED';

export interface ProductionStage {
  id: number;
  code: string;
  name: string;
  sequence: number;
  color: string;
  estimatedMinutes: number;
  requiresQa: boolean;
  isActive: boolean;
}

export interface ProductionStageHistory {
  id: number;
  stageId: number;
  stageName: string;
  stageColor: string;
  workerId?: number;
  workerName?: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  notes?: string;
  defectReason?: string;
}

export interface ProductionMaterial {
  id: number;
  productId: number;
  productName: string;
  productSku?: string;
  quantityPlanned: number;
  quantityUsed: number;
  quantityWasted: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  notes?: string;
  recordedByName?: string;
}

export interface ProductionOrder {
  id: number;
  productionNumber: string;
  status: ProductionStatus;
  statusDisplayName: string;

  orderId: number;
  orderNumber: string;
  customerName?: string;
  customerPhone?: string;

  orderItemId?: number;
  productName?: string;
  roomName?: string;
  widthMm?: number;
  heightMm?: number;

  currentStageId?: number;
  currentStageName?: string;
  currentStageColor?: string;
  currentStageSequence?: number;

  assignedWorkerId?: number;
  assignedWorkerName?: string;

  priority: number;
  deadline?: string;
  startedAt?: string;
  currentStageEnteredAt?: string;
  completedAt?: string;
  createdAt: string;

  notes?: string;
  defectReason?: string;
  createdByName?: string;

  stageHistory?: ProductionStageHistory[];
  materials?: ProductionMaterial[];
}

export interface ProductionOrderCreateRequest {
  orderId: number;
  orderItemId?: number;
  priority?: number;
  deadline?: string;
  assignedWorkerId?: number;
  notes?: string;
}

export interface ProductionStageMoveRequest {
  stageId: number;
  notes?: string;
  defectReason?: string;
}

export interface ProductionMaterialRequest {
  productId: number;
  quantityPlanned?: number;
  quantityUsed?: number;
  quantityWasted?: number;
  unit?: string;
  unitCost?: number;
  notes?: string;
}

export interface ProductionStats {
  totalOrdersInProgress: number;
  totalCompletedLast30Days: number;
  totalCancelledLast30Days: number;
  overdueOrders: number;
  averageCompletionDays?: number;
  stageDistribution: Array<{
    stageId: number;
    stageName: string;
    stageColor: string;
    sequence: number;
    count: number;
    averageMinutes?: number;
  }>;
  workerKpi: Array<{
    workerId: number;
    workerName: string;
    completedOrders: number;
    activeOrders: number;
    totalMinutes?: number;
    averageMinutesPerOrder?: number;
  }>;
  defectReasons: Array<{ reason: string; count: number }>;
  defectRatePercent: number;
  totalMaterialCost: number;
  totalMaterialWasted: number;
  wastePercent: number;
}

export const productionApi = {
  getStages: async (): Promise<ProductionStage[]> => {
    const res = await api.get<ApiResponse<ProductionStage[]>>('/v1/production/stages');
    return res.data.data;
  },

  getBoard: async (): Promise<ProductionOrder[]> => {
    const res = await api.get<ApiResponse<ProductionOrder[]>>('/v1/production/board');
    return res.data.data;
  },

  getStats: async (): Promise<ProductionStats> => {
    const res = await api.get<ApiResponse<ProductionStats>>('/v1/production/stats');
    return res.data.data;
  },

  getById: async (id: number): Promise<ProductionOrder> => {
    const res = await api.get<ApiResponse<ProductionOrder>>(`/v1/production/orders/${id}`);
    return res.data.data;
  },

  create: async (req: ProductionOrderCreateRequest): Promise<ProductionOrder> => {
    const res = await api.post<ApiResponse<ProductionOrder>>('/v1/production/orders', req);
    return res.data.data;
  },

  moveToStage: async (id: number, req: ProductionStageMoveRequest): Promise<ProductionOrder> => {
    const res = await api.post<ApiResponse<ProductionOrder>>(`/v1/production/orders/${id}/move`, req);
    return res.data.data;
  },

  assignWorker: async (id: number, workerId: number | null): Promise<ProductionOrder> => {
    const res = await api.post<ApiResponse<ProductionOrder>>(
      `/v1/production/orders/${id}/assign`,
      { workerId },
    );
    return res.data.data;
  },

  setStatus: async (id: number, status: ProductionStatus, reason?: string): Promise<ProductionOrder> => {
    const res = await api.post<ApiResponse<ProductionOrder>>(
      `/v1/production/orders/${id}/status`,
      { status, reason },
    );
    return res.data.data;
  },

  addMaterial: async (id: number, req: ProductionMaterialRequest): Promise<ProductionOrder> => {
    const res = await api.post<ApiResponse<ProductionOrder>>(
      `/v1/production/orders/${id}/materials`,
      req,
    );
    return res.data.data;
  },
};
