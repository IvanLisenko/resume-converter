import type { CandidateData } from '../types/candidate';

interface CandidateFormProps {
  data: CandidateData;
  onChange: (data: CandidateData) => void;
}

export const CandidateForm = ({ data, onChange }: CandidateFormProps) => {
  const updateField = <K extends keyof CandidateData>(
    field: K,
    value: CandidateData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  // Навыки: строка через запятую → массив
  const skillsString = data.skills.join(', ');
  const handleSkillsChange = (value: string) => {
    const skills = value.split(',').map(s => s.trim()).filter(Boolean);
    updateField('skills', skills);
  };

  // Языки: строка через запятую → массив
  const languagesString = data.languages.join(', ');
  const handleLanguagesChange = (value: string) => {
    const languages = value.split(',').map(l => l.trim()).filter(Boolean);
    updateField('languages', languages);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Данные кандидата</h2>
      <p className="text-sm text-gray-500">Проверьте и при необходимости отредактируйте данные</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ФИО */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ФИО <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.fio}
            onChange={(e) => updateField('fio', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Должность */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Должность
          </label>
          <input
            type="text"
            value={data.position}
            onChange={(e) => updateField('position', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Контакты */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Контакты (телефон, email)
        </label>
        <input
          type="text"
          value={data.contacts}
          onChange={(e) => updateField('contacts', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="+7 999 123-45-67, email@example.com"
        />
      </div>

      {/* Образование */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Образование
        </label>
        <textarea
          value={data.education}
          onChange={(e) => updateField('education', e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Навыки */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Навыки (через запятую)
        </label>
        <input
          type="text"
          value={skillsString}
          onChange={(e) => handleSkillsChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="React, TypeScript, Node.js, Python"
        />
      </div>

      {/* Языки */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Языки (через запятую)
        </label>
        <input
          type="text"
          value={languagesString}
          onChange={(e) => handleLanguagesChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Английский B2, Русский родной"
        />
      </div>

      {/* Локация (опционально) */}
      {data.location !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Локация
          </label>
          <input
            type="text"
            value={data.location}
            onChange={(e) => updateField('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      )}

      {/* Дата выхода (опционально) */}
      {data.ready_to_work !== undefined && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Готов выйти на проект
          </label>
          <input
            type="text"
            value={data.ready_to_work}
            onChange={(e) => updateField('ready_to_work', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Через 2 недели"
          />
        </div>
      )}
    </div>
  );
};