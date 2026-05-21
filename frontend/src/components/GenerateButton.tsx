import { useState } from 'react';
import { generateResume } from '../services/api';
import type { CandidateData } from '../types/candidate';

interface GenerateButtonProps {
  candidate: CandidateData;
  partnerId: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const GenerateButton = ({ candidate, partnerId, onSuccess, onError }: GenerateButtonProps) => {
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!partnerId) {
      onError?.('Выберите партнёра');
      return;
    }

    setGenerating(true);

    try {
      const blob = await generateResume(candidate, partnerId);
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `resume_${candidate.fio.replace(/\s/g, '_')}_${partnerId}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при генерации';
      onError?.(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={generating || !partnerId}
      className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
    >
      {generating ? 'Генерация...' : 'Сконвертировать'}
    </button>
  );
};