import { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MainPage } from './components/MainPage';
import { getCurrentUser } from './services/api';

function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')));

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
    <ProtectedRoute isAuthenticated={!!token}>
      <MainPage onLogout={handleLogout} />
    </ProtectedRoute>
  );
}

export default App;
