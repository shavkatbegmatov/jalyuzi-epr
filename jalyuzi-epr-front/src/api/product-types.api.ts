import api from './axios';
import type {
  ApiResponse,
  AttributeDefinition,
  AttributeSchema,
  ProductTypeEntity,
  ProductTypeRequest,
} from '../types';

/**
 * Product Types API
 * Mahsulot turlari konstruktori uchun API layer
 */
export const productTypesApi = {
  /**
   * Barcha faol mahsulot turlarini olish
   * (Foydalanuvchilar uchun - faqat faol turlar)
   */
  getAll: async (): Promise<ProductTypeEntity[]> => {
    const response = await api.get<ApiResponse<ProductTypeEntity[]>>('/v1/product-types');
    return response.data.data;
  },

  /**
   * Barcha mahsulot turlarini olish (admin uchun)
   * (Nofaol turlar ham ko'rsatiladi)
   */
  getAllAdmin: async (): Promise<ProductTypeEntity[]> => {
    const response = await api.get<ApiResponse<ProductTypeEntity[]>>('/v1/product-types/admin');
    return response.data.data;
  },

  /**
   * ID bo'yicha mahsulot turini olish
   */
  getById: async (id: number): Promise<ProductTypeEntity> => {
    const response = await api.get<ApiResponse<ProductTypeEntity>>(`/v1/product-types/${id}`);
    return response.data.data;
  },

  /**
   * Kod bo'yicha mahsulot turini olish
   */
  getByCode: async (code: string): Promise<ProductTypeEntity> => {
    const response = await api.get<ApiResponse<ProductTypeEntity>>(`/v1/product-types/code/${code}`);
    return response.data.data;
  },

  /**
   * Yangi mahsulot turi yaratish
   */
  create: async (data: ProductTypeRequest): Promise<ProductTypeEntity> => {
    const response = await api.post<ApiResponse<ProductTypeEntity>>('/v1/product-types', data);
    return response.data.data;
  },

  /**
   * Mahsulot turini yangilash
   */
  update: async (id: number, data: ProductTypeRequest): Promise<ProductTypeEntity> => {
    const response = await api.put<ApiResponse<ProductTypeEntity>>(`/v1/product-types/${id}`, data);
    return response.data.data;
  },

  /**
   * Atribut sxemasini yangilash (to'liq almashtirish)
   */
  updateSchema: async (id: number, schema: AttributeSchema): Promise<ProductTypeEntity> => {
    const response = await api.put<ApiResponse<ProductTypeEntity>>(
      `/v1/product-types/${id}/schema`,
      schema
    );
    return response.data.data;
  },

  /**
   * Atribut qo'shish
   */
  addAttribute: async (id: number, attribute: AttributeDefinition): Promise<ProductTypeEntity> => {
    const response = await api.post<ApiResponse<ProductTypeEntity>>(
      `/v1/product-types/${id}/attributes`,
      attribute
    );
    return response.data.data;
  },

  /**
   * Atributni yangilash
   */
  updateAttribute: async (
    id: number,
    attributeKey: string,
    attribute: AttributeDefinition
  ): Promise<ProductTypeEntity> => {
    const response = await api.put<ApiResponse<ProductTypeEntity>>(
      `/v1/product-types/${id}/attributes/${attributeKey}`,
      attribute
    );
    return response.data.data;
  },

  /**
   * Atributni o'chirish
   */
  removeAttribute: async (id: number, attributeKey: string): Promise<ProductTypeEntity> => {
    const response = await api.delete<ApiResponse<ProductTypeEntity>>(
      `/v1/product-types/${id}/attributes/${attributeKey}`
    );
    return response.data.data;
  },

  /**
   * Mahsulot turini o'chirish (soft delete)
   */
  delete: async (id: number): Promise<void> => {
    await api.delete(`/v1/product-types/${id}`);
  },
};
