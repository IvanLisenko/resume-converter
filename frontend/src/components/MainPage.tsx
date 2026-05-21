import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { CandidateForm } from './CandidateForm';
import { PartnerSelect } from './PartnerSelect';
import { GenerateButton } from './GenerateButton';
import type { CandidateData } from '../types/candidate';

interface MainPageProps {
  onLogout: () => void;
}

export const MainPage = ({ onLogout }: MainPageProps) => {
  const [fileLoading, setFileLoading] = useState(false);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Временный мок для загрузки файла (пока нет бэкенда)
  const handleUpload = async (file: File) => {
    setFileLoading(true);
    setError(null);
    
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
            description: 'Проект по оказанию услуг населению в электронном виде',
            responsibilities: [
              'Разработка реактивных серверных микросервисов',
              'Реализация асинхронных/многопоточных моделей',
              'Рефакторинг устаревшего кода'
            ],
            achievements: ['Успешное внедрение новых инструментов'],
            team: '10 backend, 3 frontend, 5 тестировщиков',
            stack_text: 'Java 17, Spring Boot, PostgreSQL, Docker',
            stack: ['Java 17', 'Spring Boot', 'PostgreSQL', 'Docker']
          },
        ],
        projects: [
          {
            name: 'Мобильное приложение Госуслуги',
            role: 'Team Lead',
            description: 'Разработка мобильного приложения для iOS и Android'
          },
        ],
        education: 'МГУ, Прикладная математика, 2015',
        skills: ['Java', 'Spring', 'PostgreSQL', 'Docker'],
        languages: ['Английский B2', 'Русский родной'],
        location: 'Москва, Россия',
        ready_to_work: '2 недели'
      });
      setFileLoading(false);
    }, 1500);
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
        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
            ⚠️ {error}
          </div>
        )}

        {/* Форма редактирования (показывается после загрузки файла) */}
        {candidate && (
          <div className="mt-8">
            <CandidateForm data={candidate} onChange={setCandidate} />
            
            {/* Выбор партнёра и кнопка генерации */}
            <div className="mt-8 pt-6 border-t">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <PartnerSelect onSelect={setSelectedPartner} />
                <GenerateButton
                  candidate={candidate}
                  partnerId={selectedPartner}
                  onError={setError}
                />
              </div>
            </div>
          </div>
        )}

        {/* Подсказка если нет файла */}
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