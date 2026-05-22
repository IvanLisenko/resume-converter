import type { CandidateData, Experience, Project } from '../types/candidate';
import '../styles/CandidateForm.css';

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

 
  const addProject = () => {
    const newProject: Project = {
      name: '',
      role: '',
      description: '',
    };
    const currentProjects = data.projects || [];
    updateField('projects', [...currentProjects, newProject]);
  };

  const updateProject = (index: number, field: keyof Project, value: string) => {
    const currentProjects = data.projects || [];
    const newProjects = [...currentProjects];
    newProjects[index] = { ...newProjects[index], [field]: value };
    updateField('projects', newProjects);
  };

  const removeProject = (index: number) => {
    const currentProjects = data.projects || [];
    const newProjects = currentProjects.filter((_, i) => i !== index);
    updateField('projects', newProjects);
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
    <div className="candidate-form">
      <h2 className="form-title">Данные кандидата</h2>
      <p className="form-subtitle">Проверьте и при необходимости отредактируйте данные</p>

      {/* БАЗОВЫЕ ПОЛЯ */}
      <div className="form-section">
        <div className="form-grid">
          <div className="form-field">
            <label className="form-label required">ФИО</label>
            <input
              type="text"
              value={data.fio}
              onChange={(e) => updateField('fio', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">Должность</label>
            <input
              type="text"
              value={data.position}
              onChange={(e) => updateField('position', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field full-width">
            <label className="form-label">Контакты (телефон, email)</label>
            <input
              type="text"
              value={data.contacts}
              onChange={(e) => updateField('contacts', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-field full-width">
            <label className="form-label">Образование</label>
            <textarea
              value={data.education}
              onChange={(e) => updateField('education', e.target.value)}
              rows={2}
              className="form-textarea"
            />
          </div>
        </div>
      </div>

      {/* ОПЫТ РАБОТЫ */}
      <div className="form-section">
        <div className="section-header">
          <h3 className="section-title">Опыт работы</h3>
          <button type="button" onClick={addExperience} className="add-button">
            + Добавить место работы
          </button>
        </div>

        {data.experience.length === 0 && (
          <div className="empty-state-small">Нет добавленного опыта работы</div>
        )}

        {data.experience.map((exp, index) => (
          <div key={exp.id ?? index} className="experience-card">
            <div className="card-header">
              <button type="button" onClick={() => removeExperience(index)} className="remove-button">
                ✕ Удалить
              </button>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Должность</label>
                <input
                  type="text"
                  value={exp.title}
                  onChange={(e) => updateExperience(index, 'title', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Проект / Компания</label>
                <input
                  type="text"
                  value={exp.project_name}
                  onChange={(e) => updateExperience(index, 'project_name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Период</label>
                <input
                  type="text"
                  value={exp.period}
                  onChange={(e) => updateExperience(index, 'period', e.target.value)}
                  className="form-input"
                  placeholder="сентябрь 2017 — н.в."
                />
              </div>

              <div className="form-field">
                <label className="form-label">Команда</label>
                <input
                  type="text"
                  value={exp.team}
                  onChange={(e) => updateExperience(index, 'team', e.target.value)}
                  className="form-input"
                  placeholder="10 backend, 3 frontend"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Описание проекта</label>
                <textarea
                  value={exp.description}
                  onChange={(e) => updateExperience(index, 'description', e.target.value)}
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Обязанности (каждая с новой строки)</label>
                <textarea
                  value={exp.responsibilities.join('\n')}
                  onChange={(e) => updateExperience(index, 'responsibilities', e.target.value.split('\n').filter(Boolean))}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Достижения (каждое с новой строки)</label>
                <textarea
                  value={exp.achievements.join('\n')}
                  onChange={(e) => updateExperience(index, 'achievements', e.target.value.split('\n').filter(Boolean))}
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Технологии (через запятую)</label>
                <input
                  type="text"
                  value={exp.stack.join(', ')}
                  onChange={(e) => updateExperience(index, 'stack', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ПРОЕКТЫ */}
      <div className="form-section">
        <div className="section-header">
          <h3 className="section-title">Проекты</h3>
          <button type="button" onClick={addProject} className="add-button">
            + Добавить проект
          </button>
        </div>

        {(!data.projects || data.projects.length === 0) && (
          <div className="empty-state-small">Нет добавленных проектов</div>
        )}

        {data.projects?.map((project, index) => (
          <div key={project.id ?? index} className="project-card">
            <div className="card-header">
              <button type="button" onClick={() => removeProject(index)} className="remove-button">
                ✕ Удалить
              </button>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Название проекта</label>
                <input
                  type="text"
                  value={project.name}
                  onChange={(e) => updateProject(index, 'name', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-field">
                <label className="form-label">Роль в проекте</label>
                <input
                  type="text"
                  value={project.role}
                  onChange={(e) => updateProject(index, 'role', e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-field full-width">
                <label className="form-label">Описание проекта</label>
                <textarea
                  value={project.description}
                  onChange={(e) => updateProject(index, 'description', e.target.value)}
                  rows={2}
                  className="form-textarea"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* НАВЫКИ И ЯЗЫКИ */}
      <div className="skills-languages-grid">
        <div className="form-field">
          <label className="form-label">Навыки (через запятую)</label>
          <input
            type="text"
            value={skillsString}
            onChange={(e) => handleSkillsChange(e.target.value)}
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">Языки (через запятую)</label>
          <input
            type="text"
            value={languagesString}
            onChange={(e) => handleLanguagesChange(e.target.value)}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
};