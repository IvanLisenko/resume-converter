// Опыт работы 
export interface Experience {
  id?: number;                    // для ключа в React
  title: string;                  // должность
  project_name: string;           // название проекта/компании
  period: string;                 // период работы
  description: string;            // описание проекта
  responsibilities: string[];     // обязанности (массив строк)
  achievements: string[];         // достижения (массив строк)
  team: string;                   // состав команды
  stack_text: string;             // технологии строкой (для отображения)
  stack: string[];                // технологии массивом (для работы)
}

// Проекты 
export interface Project {
  id?: number;
  name: string;
  role: string;
  description: string;
}

// Данные кандидата 
export interface CandidateData {
  fio: string;                    // ФИО
  position: string;               // должность
  contacts: string;               // контакты
  experience: Experience[];       // опыт работы (главный блок)
  projects?: Project[];           // проекты (опционально)
  education: string;              // образование
  skills: string[];               // навыки (массив)
  languages: string[];            // языки (массив)
  location?: string;              // локация (опционально)
  ready_to_work?: string;         // дата выхода на проект (опционально)
}

// Партнёр 
export interface Partner {
  id: number;
  name: string;
}

// Ответ API при успешном парсинге
export interface ParseResponse {
  data: CandidateData;
  warnings: string[];             // предупреждения (например: "не найдено ФИО")
  source: {
    filename: string;
    sizeBytes: number;
  };
}

// Ответ API при ошибке
export interface ApiError {
  detail: string;
}