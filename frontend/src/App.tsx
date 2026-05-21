import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { FileUpload } from './components/FileUpload';
import { CandidateForm } from './components/CandidateForm';
import { PartnerSelect } from './components/PartnerSelect';
import { getCurrentUser } from './services/api';
import type { CandidateData } from './types/candidate';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileLoading, setFileLoading] = useState(false);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Проверка токена при загрузке
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
    setSelectedPartner('');
    setError(null);
  };

  // Временный мок для загрузки файла (пока нет бэкенда)
  const handleUpload = async (file: File) => {
    setFileLoading(true);
    setError(null);
    
    // Имитация задержки и парсинга
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
          {
            title: 'Java Developer',
            project_name: 'МТС',
            period: 'сентябрь 2015 — июнь 2017',
            description: 'Проект по ведению отчётности для организаций',
            responsibilities: [
              'Разработка новых функций',
              'Поддержка существующего кода'
            ],
            achievements: ['Оптимизация производительности'],
            team: '5 backend, 2 frontend, 2 тестировщика',
            stack_text: 'Java 11, Spring, Hibernate, PostgreSQL',
            stack: ['Java 11', 'Spring', 'Hibernate', 'PostgreSQL']
          }
        ],
        projects: [
          {
            name: 'Мобильное приложение Госуслуги',
            role: 'Team Lead',
            description: 'Разработка мобильного приложения для iOS и Android'
          },
          {
            name: 'Автоматизация отчётности',
            role: 'Java Developer',
            description: 'Внедрение системы автоматической генерации отчётов'
          }
        ],
        education: 'МГУ, Прикладная математика, 2015',
        skills: ['Java', 'Spring', 'PostgreSQL', 'Docker', 'Kubernetes'],
        languages: ['Английский B2', 'Русский родной'],
        location: 'Москва, Россия',
        ready_to_work: '2 недели'
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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Шапка */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b">
            <h1 className="text-2xl font-bold text-gray-800">Конвертер резюме</h1>
            <button
              onClick={handleLogout}
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
              
              {/* Выбор партнёра */}
              <div className="mt-8 pt-6 border-t">
                <PartnerSelect onSelect={setSelectedPartner} />
                
                {selectedPartner && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ Выбран партнёр ID: {selectedPartner}
                  </p>
                )}
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
    </ProtectedRoute>
  );
}

export default App;