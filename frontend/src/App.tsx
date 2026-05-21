import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FileUpload } from './components/FileUpload';
import { CandidateForm } from './components/CandidateForm';
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
    
    // TODO: заменить на реальный uploadFile из api
    setTimeout(() => {
      // В handleUpload внутри setTimeout замени setCandidate на:

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
      name: 'Мобильное приложение Госуслуги',
      role: 'Team Lead',
      description: 'Разработка мобильного приложения для iOS и Android',
    },
  ],
  education: 'МГУ, Прикладная математика, 2015',
  skills: ['Java', 'Spring', 'PostgreSQL'],
  languages: ['Английский B2', 'Русский родной'],
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
          <div className="mt-6">
            <CandidateForm data={candidate} onChange={setCandidate} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default App;