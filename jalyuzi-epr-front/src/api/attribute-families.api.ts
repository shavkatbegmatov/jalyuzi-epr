import api from './axios';
import type {
  ApiResponse,
  AttributeFamily,
  AttributeFamilyRequest,
  AttributeDefinition,
  AttributeSchema,
  EffectiveSchema,
} from '../types';

const BASE = '/v1/attribute-families';

export const attributeFamiliesApi = {
  // Butun daraxt (children to'ldirilgan) — admin
  getTree: async (): Promise<AttributeFamily[]> => {
    const res = await api.get<ApiResponse<AttributeFamily[]>>(`${BASE}/tree`);
    return res.data.data;
  },

  // Faqat barg tugunlar — mahsulot yaratish uchun
  getLeaves: async (): Promise<AttributeFamily[]> => {
    const res = await api.get<ApiResponse<AttributeFamily[]>>(`${BASE}/leaves`);
    return res.data.data;
  },

  getById: async (id: number): Promise<AttributeFamily> => {
    const res = await api.get<ApiResponse<AttributeFamily>>(`${BASE}/${id}`);
    return res.data.data;
  },

  // Barg uchun yakuniy (meros + override + own) hisoblangan sxema — server hisoblaydi
  getEffectiveSchema: async (id: number): Promise<EffectiveSchema> => {
    const res = await api.get<ApiResponse<EffectiveSchema>>(`${BASE}/${id}/effective-schema`);
    return res.data.data;
  },

  create: async (data: AttributeFamilyRequest): Promise<AttributeFamily> => {
    const res = await api.post<ApiResponse<AttributeFamily>>(BASE, data);
    return res.data.data;
  },

  update: async (id: number, data: AttributeFamilyRequest): Promise<AttributeFamily> => {
    const res = await api.put<ApiResponse<AttributeFamily>>(`${BASE}/${id}`, data);
    return res.data.data;
  },

  // Tugunni boshqa otaga ko'chirish (sikl/depth tekshiruvini server qiladi)
  move: async (id: number, parentId: number | null): Promise<AttributeFamily> => {
    const params = parentId != null ? { parentId } : {};
    const res = await api.put<ApiResponse<AttributeFamily>>(`${BASE}/${id}/move`, null, { params });
    return res.data.data;
  },

  updateSchema: async (id: number, schema: AttributeSchema): Promise<AttributeFamily> => {
    const res = await api.put<ApiResponse<AttributeFamily>>(`${BASE}/${id}/schema`, schema);
    return res.data.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`${BASE}/${id}`);
  },

  // OWN atribut CRUD
  addOwnAttribute: async (id: number, attr: AttributeDefinition): Promise<AttributeFamily> => {
    const res = await api.post<ApiResponse<AttributeFamily>>(`${BASE}/${id}/attributes`, attr);
    return res.data.data;
  },

  updateOwnAttribute: async (id: number, key: string, attr: AttributeDefinition): Promise<AttributeFamily> => {
    const res = await api.put<ApiResponse<AttributeFamily>>(`${BASE}/${id}/attributes/${encodeURIComponent(key)}`, attr);
    return res.data.data;
  },

  removeOwnAttribute: async (id: number, key: string): Promise<AttributeFamily> => {
    const res = await api.delete<ApiResponse<AttributeFamily>>(`${BASE}/${id}/attributes/${encodeURIComponent(key)}`);
    return res.data.data;
  },

  // Meros atributni xossa darajasida override qilish / merosga qaytarish
  setOverride: async (id: number, key: string, changedProps: Record<string, unknown>): Promise<AttributeFamily> => {
    const res = await api.put<ApiResponse<AttributeFamily>>(
      `${BASE}/${id}/overrides/${encodeURIComponent(key)}`,
      changedProps
    );
    return res.data.data;
  },

  clearOverride: async (id: number, key: string): Promise<AttributeFamily> => {
    const res = await api.delete<ApiResponse<AttributeFamily>>(`${BASE}/${id}/overrides/${encodeURIComponent(key)}`);
    return res.data.data;
  },
};
