import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FileUpload } from './components/FileUpload';
import { getCurrentUser } from './services/api';
import type { CandidateData } from './types/candidate';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      getCurrentUser()
        .then(() => setToken(storedToken))
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (newToken: string) => {
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCandidate(null);
    setError(null);
  };

  const handleUpload = async (file: File) => {
    setFileLoading(true);
    setError(null);
    
    // Временный мок (пока нет реального uploadFile)
    setTimeout(() => {
      setCandidate({
        fio: 'Иванов Иван Иванович',
        position: 'Java Developer',
        contacts: 'test@example.com',
        experience: [],
        education: '',
        skills: [],
        languages: [],
      });
      setFileLoading(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <ProtectedRoute isAuthenticated={!!token}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Конвертер резюме</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
          >
            Выйти
          </button>
        </div>

        <FileUpload onUpload={handleUpload} isLoading={fileLoading} />

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
            Ошибка: {error}
          </div>
        )}

        {candidate && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded">
            <h2 className="font-semibold mb-2">Файл загружен!</h2>
            <p>ФИО: {candidate.fio || '—'}</p>
            <p>Должность: {candidate.position || '—'}</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default App;