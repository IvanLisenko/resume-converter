import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { CandidateForm } from './CandidateForm';
import { PartnerSelect } from './PartnerSelect';
import { GenerateButton } from './GenerateButton';
import { ErrorAlert } from './ErrorAlert';
import type { CandidateData } from '../types/candidate';
import '../styles/MainPage.css';  

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
    <div className="main-page">
      <div className="main-container">
        {/* Шапка */}
        <div className="main-header">
          <h1 className="main-logo">Конвертер резюме</h1>
          <button onClick={onLogout} className="logout-button">
            Выйти
          </button>
        </div>

        {/* Загрузка файла */}
        <div className="upload-area">
          <FileUpload onUpload={handleUpload} isLoading={fileLoading} />
        </div>

        {/* Ошибки */}
        {error && (
          <div className="error-block">
            <ErrorAlert message={error} onClose={clearError} />
          </div>
        )}

        {/* Форма редактирования */}
        {candidate && (
          <div className="candidate-section">
            <CandidateForm data={candidate} onChange={setCandidate} />
            
            <div className="action-section">
              <div className="action-grid">
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

        
      </div>
    </div>
  );
};