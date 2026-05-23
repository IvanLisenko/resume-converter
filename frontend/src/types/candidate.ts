// ============= ДОПОЛНИТЕЛЬНЫЕ ТИПЫ =============
export interface PartnerTemplate {
  id: string;
  partner_id: string;
  version: number;
  file_path: string;
  is_active: boolean;
  variables_schema: unknown;
  created_at: string;
  updated_at: string;
}

export interface OperationLog {
  id: string;
  user_id: string;
  partner_id?: string;
  operation_type: string;
  status: 'SUCCESS' | 'FAILED';
  error_code?: string;
  duration_ms?: number;
  created_at: string;
}

export interface UpdatePartnerRequest {
  name?: string;
  description?: string;
  is_active?: boolean;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  password?: string;
}

export interface TemplateVariable {
  name: string;
  description: string;
  example?: string;
}
// ============= ОПЫТ РАБОТЫ =============
export interface Experience {
  id?: number;
  title: string;
  project_name: string;
  period: string;
  description: string;
  responsibilities: string[];
  achievements: string[];
  team: string;
  stack_text: string;
  stack: string[];
  level?: string;
  role?: string;
}

// ============= ПРОЕКТЫ =============
export interface Project {
  id?: number;
  name: string;
  role: string;
  description: string;
}

// ============= ДАННЫЕ КАНДИДАТА =============
export interface CandidateData {
  fio: string;
  position: string;
  contacts: string;
  experience: Experience[];
  projects?: Project[];
  education: string;
  skills: string[];
  languages: string[];
  location?: string;
  ready_to_work?: string;
  level?: string;
  summary?: string;
}

// ============= ПАРТНЁР =============
export interface Partner {
  id: string;
  code: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============= ПОЛЬЗОВАТЕЛЬ =============
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'RECRUITER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============= ОТВЕТ ПРИ ПАРСИНГЕ =============
export interface ParseResponse {
  resume: CandidateData;
  warnings: string[];
  source: {
    filename: string;
    sizeBytes: number;
  };
}

// ============= ФОРМАТ ДЛЯ ГЕНЕРАЦИИ =============
export interface GenerateResumeRequest {
  partnerId: string;
  resume: {
    candidate: {
      full_name: string;
      position: string;
      level: string;
      location: string;
      available_from: string;
    };
    contacts: {
      phone?: string;
      email?: string;
      telegram?: string;
    };
    skills: {
      primary: string[];
      detailed: string[];
    };
    summary: string;
    education: Array<{
      raw?: string;
      university?: string;
      program?: string;
      period?: string;
    }>;
    languages: Array<{
      name: string;
      level: string;
    }>;
    experience: Array<{
      title: string;
      role: string;
      level: string;
      role_title: string;
      project_name: string;
      project_heading: string;
      period: string;
      has_stack: boolean;
      stack_line: string;
      has_description: boolean;
      description: string;
      description_heading: string;
      has_responsibilities: boolean;
      responsibilities_heading: string;
      responsibilities: string[];
      has_achievements: boolean;
      achievements_heading: string;
      achievements: string[];
    }>;
    extra: Record<string, unknown>;
  };
}

// ============= АДМИНКА - ЗАПРОСЫ =============
export interface CreatePartnerRequest {
  code: string;
  name: string;
  description?: string;
}

export interface CreateUserRequest {
  email: string;
  full_name: string;
  password: string;
  role: 'RECRUITER' | 'ADMIN';
}

// ============= ОШИБКА API =============
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}