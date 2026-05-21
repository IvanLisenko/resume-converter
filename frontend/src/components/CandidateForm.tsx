import type { CandidateData, Experience } from '../types/candidate';

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

  // ============= ОПЫТ РАБОТЫ =============
  const addExperience = () => {
    const newExperience: Experience = {
      title: '',
      project_name: '',
      period: '',
      description: '',
      responsibilities: [],
      achievements: [],
      team: '',
      stack_text: '',
      stack: [],
    };
    updateField('experience', [...data.experience, newExperience]);
  };

  const updateExperience = (index: number, field: keyof Experience, value: unknown) => {
    const newExperience = [...data.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    updateField('experience', newExperience);
  };

  const removeExperience = (index: number) => {
    const newExperience = data.experience.filter((_, i) => i !== index);
    updateField('experience', newExperience);
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
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Данные кандидата</h2>
      <p className="text-sm text-gray-500">Проверьте и при необходимости отредактируйте данные</p>

      {/* ============= БАЗОВЫЕ ПОЛЯ ============= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Контакты (телефон, email)
        </label>
        <input
          type="text"
          value={data.contacts}
          onChange={(e) => updateField('contacts', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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

      {/* ============= ОПЫТ РАБОТЫ ============= */}
      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-medium">Опыт работы</h3>
          <button
            type="button"
            onClick={addExperience}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
          >
            + Добавить место работы
          </button>
        </div>

        {data.experience.length === 0 && (
          <p className="text-gray-400 text-sm">Нет добавленного опыта работы</p>
        )}

        {data.experience.map((exp, index) => (
          <div key={exp.id ?? index} className="border rounded-lg p-4 mb-4 bg-gray-50">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => removeExperience(index)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                🗑 Удалить
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Должность
                </label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Проект / Компания
                </label>
                <input
                  type="text"
                  value={exp.project_name}
                  onChange={(e) => updateExperience(index, 'project_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Период
                </label>
                <input
                  type="text"
                  value={exp.period}
                  onChange={(e) => updateExperience(index, 'period', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="сентябрь 2017 — н.в."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Команда
                </label>
                <input
                  type="text"
                  value={exp.team}
                  onChange={(e) => updateExperience(index, 'team', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="10 backend, 3 frontend"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Описание проекта
              </label>
              <textarea
                value={exp.description}
                onChange={(e) => updateExperience(index, 'description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Обязанности (каждая с новой строки)
              </label>
              <textarea
                value={exp.responsibilities.join('\n')}
                onChange={(e) => updateExperience(index, 'responsibilities', e.target.value.split('\n').filter(Boolean))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Достижения (каждое с новой строки)
              </label>
              <textarea
                value={exp.achievements.join('\n')}
                onChange={(e) => updateExperience(index, 'achievements', e.target.value.split('\n').filter(Boolean))}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Технологии (через запятую)
              </label>
              <input
                type="text"
                value={exp.stack.join(', ')}
                onChange={(e) => updateExperience(index, 'stack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        ))}
      </div>

      {/* ============= НАВЫКИ И ЯЗЫКИ ============= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Навыки (через запятую)
          </label>
          <input
            type="text"
            value={skillsString}
            onChange={(e) => handleSkillsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Языки (через запятую)
          </label>
          <input
            type="text"
            value={languagesString}
            onChange={(e) => handleLanguagesChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};