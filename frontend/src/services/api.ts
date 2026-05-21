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

const USE_MOCK_AUTH = true;  // Временно true для тестирования

export const login = async (email: string, password: string) => {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email === 'test@example.com' && password === '123456') {
      return { access_token: 'mock-token-123' };
    }
    throw new Error('Неверный email или пароль');
  }
  
  const response = await apiClient.post('/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  if (USE_MOCK_AUTH) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return { 
      id: '1', 
      email: 'test@example.com', 
      full_name: 'Тестовый Пользователь', 
      role: 'recruiter', 
      is_active: true 
    };
  }
  
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

const USE_MOCK = true;

export const getPartners = async (): Promise<Partner[]> => {
  if (USE_MOCK) {
    await new Promise(resolve => setTimeout(resolve, 500));
    return [
      { id: 1, name: 'ООО Партнёр 1' },      // id: number
      { id: 2, name: 'ЗАО Партнёр 2' },
      { id: 3, name: 'ИП Партнёр 3' },
    ];
  }
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