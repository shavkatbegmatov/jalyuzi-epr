import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config/constants';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh Queue pattern — parallel 401 larda faqat bitta refresh so'rov yuboriladi
let isRefreshing = false;
let isLoggingOut = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((pending) => {
    if (token) {
      pending.resolve(token);
    } else {
      pending.reject(error);
    }
  });
  failedQueue = [];
}

function clearAuthAndRedirect() {
  // Takroriy chaqiruvlarni oldini olish
  if (isLoggingOut) return;
  isLoggingOut = true;

  // Zustand store'ni tozalash — isAuthenticated: false bo'ladi
  // Bu auth-storage localStorage kalitini ham yangilaydi
  useAuthStore.getState().logout();

  if (!window.location.pathname.includes('/login')) {
    toast.error('Sessioningiz tugadi. Qayta kiring.');
  }

  // Flag'ni reset qilish (keyingi login uchun)
  setTimeout(() => {
    isLoggingOut = false;
  }, 2000);
}

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors with refresh queue
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Refresh endpoint o'zi 401 qaytarsa — to'g'ridan-to'g'ri logout
      if (originalRequest.url?.includes('/auth/refresh-token')) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // Agar refresh allaqachon jarayonda bo'lsa — navbatga qo'shib kutamiz
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      // Birinchi 401 — refresh jarayonini boshlaymiz
      isRefreshing = true;

      try {
        const response = await axios.post(
          `${API_BASE_URL}/v1/auth/refresh-token`,
          null,
          { params: { refreshToken } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Navbatdagi barcha so'rovlarni yangi token bilan qayta yuborish
        processQueue(null, accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh fail — barcha navbatdagi so'rovlarni reject qilish
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      const message = (error.response?.data as { message?: string })?.message || "Sizda bu amalni bajarish uchun ruxsat yo'q";

      toast.error(message, {
        duration: 4000,
        icon: '🔒',
      });

      console.warn('Permission denied:', error.config?.url, message);
    }

    return Promise.reject(error);
  }
);

export default api;
