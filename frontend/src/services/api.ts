import axios from 'axios';
import type { CandidateData, Partner, ParseResponse } from '../types/candidate';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ================= TOKEN =================
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ================= ERROR HANDLING =================
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const detail = error.response.data?.detail;

      if (status === 401) throw new Error('Не авторизован. Войдите снова.');
      if (status === 400) throw new Error(detail || 'Некорректный запрос');
      if (status === 404) throw new Error('Сервис не найден');
      if (status === 502) throw new Error('Бэкенд недоступен');
      throw new Error(detail || 'Ошибка сервера');
    }

    if (error.request) {
      throw new Error('Нет соединения с сервером');
    }

    throw new Error(error.message || 'Неизвестная ошибка');
  }
);

// ================= AUTH =================
export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', {
    email,
    password,
  });

  return response.data; // { access_token, token_type }
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// ================= RESUME =================
export const uploadFile = async (file: File): Promise<CandidateData> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ParseResponse>(
    '/resumes/extract',
    formData
  );

  return response.data.data;
};

// ================= PARTNERS =================
export const getPartners = async (): Promise<Partner[]> => {
  const response = await apiClient.get('/partners');
  return response.data;
};

// ================= GENERATION =================
export const generateResume = async (
  candidate: CandidateData,
  partnerId: string
): Promise<Blob> => {
  const response = await apiClient.post(
    '/resumes/generate',
    {
      candidate,
      partner_id: partnerId,
    },
    {
      responseType: 'blob',
    }
  );

  return response.data;
};

export default {
  login,
  getCurrentUser,
  uploadFile,
  getPartners,
  generateResume,
};