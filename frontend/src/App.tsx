import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { getCurrentUser } from './services/api';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      // Проверим что токен валидный
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
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Конвертер резюме</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
        >
          Выйти
        </button>
      </div>
      
      <p className="text-green-600">Добро пожаловать! Вы авторизованы.</p>
      {/* Здесь будут остальные компоненты (загрузка файла, форма и т.д.) */}
    </div>
  );
}

export default App;