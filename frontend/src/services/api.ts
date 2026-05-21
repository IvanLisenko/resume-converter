import axios from 'axios';
import type { CandidateData, Partner, ParseResponse } from '../types/candidate';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============= АВТОРИЗАЦИЯ =============

export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

// ============= РЕЗЮМЕ =============

export const uploadFile = async (file: File): Promise<CandidateData> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ParseResponse>('/resumes/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data.warnings?.length) {
    console.warn('Парсинг с предупреждениями:', response.data.warnings);
  }

  return response.data.data;
};

// ============= ПАРТНЁРЫ =============

export const getPartners = async (): Promise<Partner[]> => {
  const response = await apiClient.get<Partner[]>('/partners');
  return response.data;
};

// ============= ГЕНЕРАЦИЯ (ПОТОМ) =============

// TODO: заменить мок на реальный запрос, когда появится эндпоинт
export const generateResume = async (
  candidate: CandidateData,
  partnerId: string
): Promise<Blob> => {
  console.log('Генерация для партнёра:', partnerId, candidate);
  
  // Мок-заглушка
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const mockContent = `ФИО: ${candidate.fio}\nДолжность: ${candidate.position}\nПартнёр ID: ${partnerId}`;
  return new Blob([mockContent], { 
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
  });

};

export default {
  login,
  getCurrentUser,
  uploadFile,
  getPartners,
  generateResume,
};