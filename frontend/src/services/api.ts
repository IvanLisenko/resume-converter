import axios from 'axios';
import type { 
  CandidateData, 
  Partner, 
  ParseResponse, 
  GenerateResumeRequest,
  ApiError 
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
  // Контакты
  const contactsParts = [];
  if (raw.contacts?.email) contactsParts.push(raw.contacts.email);
  if (raw.contacts?.phone) contactsParts.push(raw.contacts.phone);
  if (raw.contacts?.telegram) contactsParts.push(raw.contacts.telegram);
  
  // ========== ОБРАЗОВАНИЕ (с поддержкой поля raw) ==========
  let educationStr = '';
  
  if (raw.education) {
    // Если массив
    if (Array.isArray(raw.education) && raw.education.length > 0) {
      educationStr = raw.education.map((edu: any) => {
        // Если есть поле raw — берём его (как в твоём случае)
        if (edu.raw) {
          return edu.raw;
        }
        // Если есть стандартные поля
        const parts = [];
        if (edu.university) parts.push(edu.university);
        if (edu.program) parts.push(edu.program);
        if (edu.degree) parts.push(edu.degree);
        if (edu.period) parts.push(`(${edu.period})`);
        if (edu.start_year && edu.end_year) parts.push(`${edu.start_year}-${edu.end_year}`);
        else if (edu.start_year) parts.push(`с ${edu.start_year}`);
        else if (edu.end_year) parts.push(`по ${edu.end_year}`);
        return parts.join(' ');
      }).join('\n');
    }
    // Если объект (не массив)
    else if (typeof raw.education === 'object' && !Array.isArray(raw.education)) {
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
    }
    // Если строка
    else if (typeof raw.education === 'string') {
      educationStr = raw.education;
    }
  }
  
  // Если educationStr пустой, но есть candidate.education
  if (!educationStr && raw.candidate?.education) {
    educationStr = raw.candidate.education;
  }
  
  // ========== ЯЗЫКИ (массив объектов → массив строк) ==========
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
  
  // ========== НАВЫКИ (объект с primary/detailed → массив) ==========
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
  // Удаляем дубликаты
  skills = [...new Set(skills)];
  
  // ========== ОПЫТ РАБОТЫ ==========
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

  console.log('Raw data from backend:', response.data.resume);
  const mapped = mapBackendToFrontend(response.data.resume);
  console.log('Mapped data for form:', mapped);
  
  return mapped;
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
  
  // Образование: строка → массив объектов с полем raw
  const education = [];
  if (candidate.education) {
    const lines = candidate.education.split('\n');
    for (const line of lines) {
      if (line.trim()) {
        education.push({
          raw: line.trim(),
        });
      }
    }
  }
  
  // Языки: массив строк → массив объектов
  const languages = [];
  if (Array.isArray(candidate.languages)) {
    for (const lang of candidate.languages) {
      const match = lang.match(/^([^(]+)(?:\s*\(([^)]+)\))?$/);
      if (match) {
        languages.push({
          name: match[1].trim(),
          level: match[2] || '',
        });
      } else {
        languages.push({ name: lang, level: '' });
      }
    }
  }
  
  // Навыки: массив → primary (первые 15) + detailed (остальные)
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
    contacts: {
      phone,
      email,
    },
    skills: {
      primary: primarySkills,
      detailed: detailedSkills,
    },
    summary: candidate.summary || '',
    education,
    languages,
    experience: candidate.experience?.map(exp => ({
      role: exp.title,
      level: '',
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

  console.log('Generation request:', requestBody);

  const response = await apiClient.post('/v1/resumes/generate', requestBody, {
    responseType: 'blob',
  });

  return response.data;
};

export default {
  login,
  getCurrentUser,
  uploadFile,
  getPartners,
  generateResume,
};