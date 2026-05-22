import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { CandidateForm } from './CandidateForm';
import { PartnerSelect } from './PartnerSelect';
import { GenerateButton } from './GenerateButton';
import { ErrorAlert } from './ErrorAlert';
import type { CandidateData } from '../types/candidate';
import { uploadFile } from '../services/api';
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

    try {
      const data = await uploadFile(file);
      setCandidate(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки файла');
    } finally {
      setFileLoading(false);
    }
  };

  return (
    <div className="main-page">
      <div className="main-container">

        <div className="main-header">
          <h1 className="main-logo">Конвертер резюме</h1>
          <button onClick={onLogout} className="logout-button">
            Выйти
          </button>
        </div>

        <div className="upload-area">
          <FileUpload onUpload={handleUpload} isLoading={fileLoading} />
        </div>

        {error && (
          <div className="error-block">
            <ErrorAlert message={error} onClose={() => setError(null)} />
          </div>
        )}

        {candidate && (
          <div className="candidate-section">
            <CandidateForm data={candidate} onChange={setCandidate} />

            <div className="action-section">
              <div className="action-grid">
                <PartnerSelect onSelect={setSelectedPartner} />

                <GenerateButton
                  candidate={candidate}
                  partnerId={selectedPartner}
                  onError={setError}
                  onSuccess={() => setError(null)}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};