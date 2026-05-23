// ============= ОПЫТ РАБОТЫ (внутренняя структура для формы) =============
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
}

// ============= ПРОЕКТЫ =============
export interface Project {
  id?: number;
  name: string;
  role: string;
  description: string;
}

// ============= ДАННЫЕ КАНДИДАТА (внутренняя форма) =============
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
  name: string;
  code?: string;
  description?: string;
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

// ============= ФОРМАТ ДЛЯ ГЕНЕРАЦИИ (бэкенд) =============
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
      start_year?: number;
      end_year?: number;
    }>;
    languages: Array<{
      name: string;
      level: string;
    }>;
    experience: Array<{
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

// ============= ОШИБКА API =============
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}