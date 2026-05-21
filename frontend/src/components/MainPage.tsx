import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { CandidateForm } from './CandidateForm';
import { PartnerSelect } from './PartnerSelect';
import { GenerateButton } from './GenerateButton';
import { ErrorAlert } from './ErrorAlert';
import type { CandidateData } from '../types/candidate';

interface MainPageProps {
  onLogout: () => void;
}

export const MainPage = ({ onLogout }: MainPageProps) => {
  const [fileLoading, setFileLoading] = useState(false);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    setFileLoading(true);
    setError(null);
    
    // TODO: заменить на реальный uploadFile из api
    setTimeout(() => {
      setCandidate({
        fio: 'Иванов Иван Иванович',
        position: 'Java Developer',
        contacts: 'ivan@example.com | +7 999 123-45-67',
        experience: [
          {
            title: 'Teamlead Java',
            project_name: 'Госуслуги',
            period: 'сентябрь 2017 — н.в.',
            description: 'Проект по оказанию услуг населению',
            responsibilities: ['Разработка микросервисов', 'Рефакторинг кода'],
            achievements: ['Внедрение новых инструментов'],
            team: '10 backend, 3 frontend',
            stack_text: 'Java 17, Spring Boot, PostgreSQL',
            stack: ['Java 17', 'Spring Boot', 'PostgreSQL'],
          },
        ],
        projects: [
          {
            name: 'Мобильное приложение',
            role: 'Team Lead',
            description: 'Разработка мобильного приложения',
          },
        ],
        education: 'МГУ, Прикладная математика, 2015',
        skills: ['Java', 'Spring', 'PostgreSQL'],
        languages: ['Английский B2', 'Русский родной'],
      });
      setFileLoading(false);
    }, 1500);
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
  };

  const clearError = () => {
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Шапка */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold text-gray-800">Конвертер резюме</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
          >
            Выйти
          </button>
        </div>

        {/* Загрузка файла */}
        <FileUpload onUpload={handleUpload} isLoading={fileLoading} />

        {/* Ошибки */}
        {error && <ErrorAlert message={error} onClose={clearError} />}

        {/* Форма редактирования */}
        {candidate && (
          <div className="mt-8">
            <CandidateForm data={candidate} onChange={setCandidate} />
            
            <div className="mt-8 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <PartnerSelect onSelect={setSelectedPartner} />
                <GenerateButton
                  candidate={candidate}
                  partnerId={selectedPartner}
                  onError={handleError}
                  onSuccess={clearError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Подсказка */}
        {!candidate && !fileLoading && (
          <div className="mt-8 text-center text-gray-400">
            <p>Загрузите резюме в формате .docx</p>
            <p className="text-sm mt-1">Поддерживаются файлы до 10 МБ</p>
          </div>
        )}
      </div>
    </div>
  );
};