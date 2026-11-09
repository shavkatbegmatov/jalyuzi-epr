import api from './axios';
import type { ApiResponse, JwtResponse, User } from '../types';

export interface TelegramLoginResponse {
  linked: boolean;
  auth?: JwtResponse;
  telegramName?: string;
}

export interface TelegramStaffInfo {
  enabled: boolean;
  botUsername?: string;
  /** https://t.me/BOT?start=xodim */
  startLink?: string;
  webAppUrl?: string;
}

/** Xodimlar Telegram Mini App'i: initData orqali kirish va akkauntni ulash/uzish */
export const telegramAuthApi = {
  info: async (): Promise<TelegramStaffInfo> => {
    const response = await api.get<ApiResponse<TelegramStaffInfo>>('/v1/auth/telegram/info');
    return response.data.data;
  },

  login: async (initData: string): Promise<TelegramLoginResponse> => {
    const response = await api.post<ApiResponse<TelegramLoginResponse>>('/v1/auth/telegram', { initData });
    return response.data.data;
  },

  link: async (initData: string): Promise<User> => {
    const response = await api.post<ApiResponse<User>>('/v1/auth/telegram/link', { initData });
    return response.data.data;
  },

  unlink: async (): Promise<User> => {
    const response = await api.delete<ApiResponse<User>>('/v1/auth/telegram/link');
    return response.data.data;
  },
};
