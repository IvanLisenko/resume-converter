import { useState } from 'react';
import { login } from '../services/api';
import { ErrorAlert } from './ErrorAlert';
import '../styles/Login.css';

interface LoginProps {
  onLogin: (token: string) => void;
}

export const Login = ({ onLogin }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await login(email, password);
      localStorage.setItem('token', response.access_token);
      onLogin(response.access_token);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Неверный email или пароль';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Конвертер резюме</h1>
        <p className="login-subtitle">Вход в систему</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
              required
            />
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && <ErrorAlert message={error} onClose={() => setError('')} />}

         <button
  type="submit"
  disabled={loading}
  className="login-button"
>
  {loading ? 'Вход...' : 'Войти'}
</button>
        </form>
      </div>
    </div>
  );
};