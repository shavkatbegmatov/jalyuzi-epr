import api from './axios';
import type { ApiResponse, PagedResponse } from '../types';

export type WarrantyIssueType =
  | 'MECHANISM'
  | 'FABRIC'
  | 'MOTOR'
  | 'INSTALLATION'
  | 'OTHER';

export type WarrantyClaimStatus =
  | 'NEW'
  | 'IN_PROGRESS'
  | 'WAITING_PARTS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

export type ServiceVisitStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface ServiceVisit {
  id: number;
  claimId: number;
  technicianId?: number;
  technicianName?: string;
  scheduledDate: string;
  scheduledTime?: string;
  actualArrivedAt?: string;
  completedAt?: string;
  visitNotes?: string;
  actionTaken?: string;
  partsUsed?: string[];
  photosBefore?: string[];
  photosAfter?: string[];
  customerRating?: number;
  customerFeedback?: string;
  status: ServiceVisitStatus;
  statusDisplayName: string;
}

export interface WarrantyClaim {
  id: number;
  claimNumber: string;
  orderId: number;
  orderNumber?: string;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  issueType: WarrantyIssueType;
  issueTypeDisplayName: string;
  issueDescription: string;
  photos?: string[];
  status: WarrantyClaimStatus;
  statusDisplayName: string;
  priority: number;
  assignedToId?: number;
  assignedToName?: string;
  resolution?: string;
  isWarrantyCovered?: boolean;
  costToCustomer: number;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
  submittedByName?: string;
  visits?: ServiceVisit[];
}

export interface WarrantyClaimCreate {
  orderId: number;
  issueType: WarrantyIssueType;
  issueDescription: string;
  photos?: string[];
  priority?: number;
}

export interface ServiceVisitCreate {
  scheduledDate: string;
  scheduledTime?: string;
  technicianId?: number;
  visitNotes?: string;
}

export const warrantyApi = {
  list: async (status?: WarrantyClaimStatus, page = 0, size = 20): Promise<PagedResponse<WarrantyClaim>> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('size', size.toString());
    const res = await api.get<ApiResponse<PagedResponse<WarrantyClaim>>>(`/v1/warranty/claims?${params}`);
    return res.data.data;
  },

  getById: async (id: number): Promise<WarrantyClaim> => {
    const res = await api.get<ApiResponse<WarrantyClaim>>(`/v1/warranty/claims/${id}`);
    return res.data.data;
  },

  create: async (req: WarrantyClaimCreate): Promise<WarrantyClaim> => {
    const res = await api.post<ApiResponse<WarrantyClaim>>('/v1/warranty/claims', req);
    return res.data.data;
  },

  changeStatus: async (id: number, status: WarrantyClaimStatus, resolution?: string): Promise<WarrantyClaim> => {
    const res = await api.post<ApiResponse<WarrantyClaim>>(`/v1/warranty/claims/${id}/status`, { status, resolution });
    return res.data.data;
  },

  assign: async (id: number, userId: number | null): Promise<WarrantyClaim> => {
    const res = await api.post<ApiResponse<WarrantyClaim>>(`/v1/warranty/claims/${id}/assign`, { userId });
    return res.data.data;
  },

  setCoverage: async (id: number, covered: boolean, cost?: number): Promise<WarrantyClaim> => {
    const res = await api.post<ApiResponse<WarrantyClaim>>(`/v1/warranty/claims/${id}/coverage`, { covered, cost });
    return res.data.data;
  },

  scheduleVisit: async (id: number, req: ServiceVisitCreate): Promise<WarrantyClaim> => {
    const res = await api.post<ApiResponse<WarrantyClaim>>(`/v1/warranty/claims/${id}/visits`, req);
    return res.data.data;
  },

  completeVisit: async (visitId: number, actionTaken: string): Promise<WarrantyClaim> => {
    const res = await api.post<ApiResponse<WarrantyClaim>>(`/v1/warranty/claims/visits/${visitId}/complete`, { actionTaken });
    return res.data.data;
  },
};
