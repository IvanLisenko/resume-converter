import axios from 'axios';
import type { 
  CandidateData, 
  Partner, 
  ParseResponse, 
  GenerateResumeRequest,
  ApiError,
  CreatePartnerRequest,
  User,
  CreateUserRequest,
  PartnerTemplate,
  UpdatePartnerRequest,
  UpdateUserRequest,
  OperationLog,
  TemplateVariable
} from '../types/candidate';


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
      const data = error.response.data as ApiError;

      if (status === 401) throw new Error(data?.message || 'Не авторизован. Войдите снова.');
      if (status === 400) throw new Error(data?.message || 'Некорректный запрос');
      if (status === 404) throw new Error(data?.message || 'Сервис не найден');
      if (status === 502) throw new Error('Бэкенд недоступен');
      throw new Error(data?.message || 'Ошибка сервера');
    }
    if (error.request) {
      throw new Error('Нет соединения с сервером');
    }
    throw new Error(error.message || 'Неизвестная ошибка');
  }
);

// ================= AUTH =================
export const login = async (email: string, password: string) => {
  const response = await apiClient.post('/v1/auth/login', { email, password });
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await apiClient.get('/v1/auth/me');
  return response.data;
};

// ================= RESUME =================
const mapBackendToFrontend = (raw: any): CandidateData => {
  const contactsParts = [];
  if (raw.contacts?.email) contactsParts.push(raw.contacts.email);
  if (raw.contacts?.phone) contactsParts.push(raw.contacts.phone);
  if (raw.contacts?.telegram) contactsParts.push(raw.contacts.telegram);
  
  let educationStr = '';
  if (raw.education) {
    if (Array.isArray(raw.education) && raw.education.length > 0) {
      educationStr = raw.education.map((edu: any) => {
        if (edu.raw) return edu.raw;
        const parts = [];
        if (edu.university) parts.push(edu.university);
        if (edu.program) parts.push(edu.program);
        if (edu.degree) parts.push(edu.degree);
        if (edu.period) parts.push(`(${edu.period})`);
        return parts.join(' ');
      }).join('\n');
    } else if (typeof raw.education === 'object' && !Array.isArray(raw.education)) {
      const edu = raw.education;
      if (edu.raw) {
        educationStr = edu.raw;
      } else {
        const parts = [];
        if (edu.university) parts.push(edu.university);
        if (edu.program) parts.push(edu.program);
        if (edu.degree) parts.push(edu.degree);
        if (edu.period) parts.push(`(${edu.period})`);
        educationStr = parts.join(' ');
      }
    } else if (typeof raw.education === 'string') {
      educationStr = raw.education;
    }
  }
  
  const languages: string[] = [];
  if (Array.isArray(raw.languages)) {
    raw.languages.forEach((lang: any) => {
      if (typeof lang === 'string') {
        languages.push(lang);
      } else if (lang.name) {
        languages.push(lang.level ? `${lang.name} (${lang.level})` : lang.name);
      }
    });
  } else if (typeof raw.languages === 'string') {
    languages.push(raw.languages);
  }
  
  let skills: string[] = [];
  if (raw.skills) {
    if (Array.isArray(raw.skills)) {
      skills = raw.skills;
    } else {
      if (raw.skills.primary && Array.isArray(raw.skills.primary)) {
        skills.push(...raw.skills.primary);
      }
      if (raw.skills.detailed && Array.isArray(raw.skills.detailed)) {
        skills.push(...raw.skills.detailed);
      }
    }
  }
  skills = [...new Set(skills)];
  
  const experience = (raw.experience || []).map((exp: any, idx: number) => ({
    id: idx,
    title: exp.title || exp.role || '',
    project_name: exp.project_name || '',
    period: exp.period || '',
    description: exp.description || '',
    responsibilities: Array.isArray(exp.responsibilities) ? exp.responsibilities : [],
    achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
    team: exp.team || '',
    stack_text: exp.stack_text || '',
    stack: Array.isArray(exp.stack) ? exp.stack : [],
    level: exp.level || '',
  }));
  
  return {
    fio: raw.candidate?.full_name || '',
    position: raw.candidate?.position || '',
    level: raw.candidate?.level || '',
    location: raw.candidate?.location || '',
    ready_to_work: raw.candidate?.available_from || '',
    contacts: contactsParts.join(' | ') || '',
    summary: raw.summary || '',
    education: educationStr,
    skills: skills,
    languages: languages,
    experience: experience,
    projects: [],
  };
};

export const uploadFile = async (file: File): Promise<CandidateData> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ParseResponse>('/v1/resumes/extract', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  if (response.data.warnings?.length) {
    console.warn('Парсинг с предупреждениями:', response.data.warnings);
  }

  return mapBackendToFrontend(response.data.resume);
};

// ================= PARTNERS =================
export const getPartners = async (): Promise<Partner[]> => {
  const response = await apiClient.get<Partner[]>('/v1/partners');
  return response.data;
};

// ================= GENERATION =================
const convertToBackendFormat = (candidate: CandidateData): GenerateResumeRequest['resume'] => {
  let phone = '';
  let email = '';
  if (candidate.contacts) {
    const phoneMatch = candidate.contacts.match(/[\+\d\s\-\(\)]{10,}/);
    if (phoneMatch) phone = phoneMatch[0];
    const emailMatch = candidate.contacts.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    if (emailMatch) email = emailMatch[0];
  }
  
  const education: any[] = [];
  if (candidate.education) {
    const lines = candidate.education.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        education.push({ raw: line.trim() });
      }
    }
  }
  
  const languages = [];
  if (Array.isArray(candidate.languages)) {
    for (const lang of candidate.languages) {
      const match = lang.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
      if (match) {
        languages.push({ name: match[1].trim(), level: match[2] || '' });
      } else {
        languages.push({ name: lang, level: '' });
      }
    }
  }
  
  const allSkills = candidate.skills || [];
  const primarySkills = allSkills.slice(0, 15);
  const detailedSkills = allSkills.slice(15);
  
  return {
    candidate: {
      full_name: candidate.fio,
      position: candidate.position,
      level: candidate.level || '',
      location: candidate.location || '',
      available_from: candidate.ready_to_work || '',
    },
    contacts: { phone, email },
    skills: { primary: primarySkills, detailed: detailedSkills },
    summary: candidate.summary || '',
    education,
    languages,
    experience: candidate.experience?.map(exp => ({
      title: exp.title,
      role: exp.title,
      level: exp.level || '',
      role_title: exp.title,
      project_name: exp.project_name,
      project_heading: exp.project_name,
      period: exp.period,
      has_stack: !!(exp.stack?.length),
      stack_line: exp.stack?.join(', ') || '',
      has_description: !!exp.description,
      description: exp.description,
      description_heading: 'Описание проекта',
      has_responsibilities: !!(exp.responsibilities?.length),
      responsibilities_heading: 'Обязанности',
      responsibilities: exp.responsibilities || [],
      has_achievements: !!(exp.achievements?.length),
      achievements_heading: 'Достижения',
      achievements: exp.achievements || [],
    })) || [],
    extra: {},
  };
};

export const generateResume = async (
  candidate: CandidateData,
  partnerId: string
): Promise<Blob> => {
  const requestBody: GenerateResumeRequest = {
    partnerId,
    resume: convertToBackendFormat(candidate),
  };

  const response = await apiClient.post('/v1/resumes/generate', requestBody, {
    responseType: 'blob',
  });

  return response.data;
};

// ================= ADMIN - PARTNERS =================
export const getAllPartners = async (): Promise<Partner[]> => {
  const response = await apiClient.get<Partner[]>('/v1/admin/partners');
  return response.data;
};

export const createPartner = async (data: CreatePartnerRequest): Promise<Partner> => {
  const response = await apiClient.post<Partner>('/v1/admin/partners', data);
  return response.data;
};

export const deletePartner = async (partnerId: string): Promise<void> => {
  await apiClient.delete(`/v1/admin/partners/${partnerId}`);
};

export const uploadTemplate = async (partnerId: string, file: File): Promise<void> => {
  const formData = new FormData();
  formData.append('file', file);
  await apiClient.post(`/v1/admin/partners/${partnerId}/templates`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ================= ADMIN - USERS =================
export const getAllUsers = async (): Promise<User[]> => {
  const response = await apiClient.get<User[]>('/v1/admin/users');
  return response.data;
};

export const createUser = async (data: CreateUserRequest): Promise<User> => {
  const response = await apiClient.post<User>('/v1/admin/users', data);
  return response.data;
};

export const updateUserRole = async (userId: string, role: 'RECRUITER' | 'ADMIN'): Promise<User> => {
  const response = await apiClient.patch<User>(`/v1/admin/users/${userId}/role`, { role });
  return response.data;
};

export const blockUser = async (userId: string): Promise<User> => {
  const response = await apiClient.patch<User>(`/v1/admin/users/${userId}/block`);
  return response.data;
};

export const unblockUser = async (userId: string): Promise<User> => {
  const response = await apiClient.patch<User>(`/v1/admin/users/${userId}/unblock`);
  return response.data;
};
// ================= ADMIN - PARTNER TEMPLATES =================
export const getPartnerTemplates = async (partnerId: string): Promise<PartnerTemplate[]> => {
  const response = await apiClient.get<PartnerTemplate[]>(`/v1/admin/partners/${partnerId}/templates`);
  return response.data;
};

// ================= ADMIN - UPDATE PARTNER =================
export const updatePartner = async (partnerId: string, data: UpdatePartnerRequest): Promise<Partner> => {
  const response = await apiClient.patch<Partner>(`/v1/admin/partners/${partnerId}`, data);
  return response.data;
};

// ================= ADMIN - UPDATE USER =================
export const updateUser = async (userId: string, data: UpdateUserRequest): Promise<User> => {
  const response = await apiClient.patch<User>(`/v1/admin/users/${userId}`, data);
  return response.data;
};

// ================= ADMIN - OPERATION LOGS =================
export const getOperationLogs = async (limit: number = 100): Promise<OperationLog[]> => {
  const response = await apiClient.get<OperationLog[]>(`/v1/admin/operation-logs?limit=${limit}`);
  return response.data;
};

// ================= TEMPLATE VARIABLES =================
export const getTemplateVariables = async (): Promise<TemplateVariable[]> => {
  const response = await apiClient.get<TemplateVariable[]>('/v1/template-variables');
  return response.data;
};

// ================= SYSTEM HEALTH =================
export const getHealth = async (): Promise<{ status: string }> => {
  const response = await apiClient.get('/v1/health');
  return response.data;
};

export const getReady = async (): Promise<{ status: string; database: string }> => {
  const response = await apiClient.get('/v1/ready');
  return response.data;
};

// ================= GET SINGLE PARTNER =================
export const getPartner = async (partnerId: string): Promise<Partner> => {
  const response = await apiClient.get<Partner>(`/v1/partners/${partnerId}`);
  return response.data;
};

export const getAdminPartner = async (partnerId: string): Promise<Partner> => {
  const response = await apiClient.get<Partner>(`/v1/admin/partners/${partnerId}`);
  return response.data;
};

// ================= GET SINGLE USER =================
export const getUser = async (userId: string): Promise<User> => {
  const response = await apiClient.get<User>(`/v1/admin/users/${userId}`);
  return response.data;
};
export default {
  login,
  getCurrentUser,
  uploadFile,
  getPartners,
  generateResume,
  getAllPartners,
  createPartner,
  deletePartner,
  uploadTemplate,
  getAllUsers,
  createUser,
  updateUserRole,
  blockUser,
  unblockUser,
  getPartnerTemplates,
  updatePartner,
  updateUser,
  getOperationLogs,
  getTemplateVariables,
  getHealth,
  getReady,
  getPartner,
  getAdminPartner,
  getUser,
};