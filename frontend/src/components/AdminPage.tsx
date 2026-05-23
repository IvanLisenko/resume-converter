import { useState, useEffect } from 'react';
import {
  getAllPartners,
  createPartner,
  deletePartner,
  uploadTemplate,
  getAllUsers,
  createUser,
  updateUserRole,
  blockUser,
  unblockUser,
} from '../services/api';
import type { Partner, User } from '../types/candidate';
import '../styles/AdminPage.css';

interface AdminPageProps {
  onLogout: () => void;
}

export const AdminPage = ({ onLogout }: AdminPageProps) => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [newPartner, setNewPartner] = useState({ code: '', name: '', description: '' });
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  
  const [newUser, setNewUser] = useState({ 
    email: '', 
    full_name: '', 
    password: '', 
    role: 'RECRUITER' as 'RECRUITER' | 'ADMIN' 
  });

  const loadData = async () => {
    try {
      const [partnersData, usersData] = await Promise.all([
        getAllPartners(),
        getAllUsers(),
      ]);
      setPartners(partnersData);
      setUsers(usersData);
    } catch {
      setError('Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      getAllPartners(),
      getAllUsers(),
    ])
      .then(([partnersData, usersData]) => {
        setPartners(partnersData);
        setUsers(usersData);
      })
      .catch(() => {
        setError('Ошибка загрузки данных');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCreatePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createPartner(newPartner);
      setSuccess('Партнёр создан');
      setNewPartner({ code: '', name: '', description: '' });
      loadData();
    } catch {
      setError('Ошибка создания партнёра');
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm('Удалить партнёра?')) return;
    try {
      await deletePartner(id);
      setSuccess('Партнёр удалён');
      loadData();
    } catch {
      setError('Ошибка удаления');
    }
  };

  const handleUploadTemplate = async () => {
    if (!selectedPartnerId || !templateFile) {
      setError('Выберите партнёра и файл');
      return;
    }
    try {
      await uploadTemplate(selectedPartnerId, templateFile);
      setSuccess('Шаблон загружен');
      setTemplateFile(null);
      setSelectedPartnerId('');
    } catch {
      setError('Ошибка загрузки шаблона');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createUser(newUser);
      setSuccess('Пользователь создан');
      setNewUser({ email: '', full_name: '', password: '', role: 'RECRUITER' });
      loadData();
    } catch {
      setError('Ошибка создания пользователя');
    }
  };

  const handleToggleBlock = async (user: User) => {
    try {
      if (user.is_active) {
        await blockUser(user.id);
      } else {
        await unblockUser(user.id);
      }
      setSuccess(user.is_active ? 'Пользователь заблокирован' : 'Пользователь разблокирован');
      loadData();
    } catch {
      setError('Ошибка');
    }
  };

  const handleChangeRole = async (userId: string, role: 'RECRUITER' | 'ADMIN') => {
    try {
      await updateUserRole(userId, role);
      setSuccess('Роль изменена');
      loadData();
    } catch {
      setError('Ошибка изменения роли');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-container">
        <div className="admin-header">
          <h1 className="admin-title">Администрирование</h1>
          <button onClick={onLogout} className="logout-button">
            Выйти
          </button>
        </div>

        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        {success && <div className="admin-alert admin-alert-success">{success}</div>}

        <div className="admin-grid">
          {/* Создание партнёра */}
          <div className="admin-card">
            <h2 className="admin-card-title">Создать партнёра</h2>
            <form onSubmit={handleCreatePartner} className="admin-form">
              <input
                type="text"
                placeholder="Код (латиница)"
                value={newPartner.code}
                onChange={(e) => setNewPartner({ ...newPartner, code: e.target.value })}
                className="admin-input"
                required
              />
              <input
                type="text"
                placeholder="Название"
                value={newPartner.name}
                onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                className="admin-input"
                required
              />
              <input
                type="text"
                placeholder="Описание"
                value={newPartner.description}
                onChange={(e) => setNewPartner({ ...newPartner, description: e.target.value })}
                className="admin-input"
              />
              <button type="submit" className="admin-button admin-button-primary">
                Создать
              </button>
            </form>
          </div>

          {/* Загрузка шаблона */}
          <div className="admin-card">
            <h2 className="admin-card-title">Загрузить шаблон</h2>
            <div className="admin-form">
              <select
                value={selectedPartnerId}
                onChange={(e) => setSelectedPartnerId(e.target.value)}
                className="admin-select"
              >
                <option value="">Выберите партнёра</option>
                {partners.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input
                type="file"
                accept=".docx"
                onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                className="admin-file"
              />
              <button
                onClick={handleUploadTemplate}
                disabled={!selectedPartnerId || !templateFile}
                className="admin-button admin-button-success"
              >
                Загрузить
              </button>
            </div>
          </div>

          {/* Список партнёров */}
          <div className="admin-card">
            <h2 className="admin-card-title">Партнёры</h2>
            {partners.length === 0 ? (
              <p className="text-gray-500 text-center py-4">Нет партнёров</p>
            ) : (
              <ul className="admin-partner-list">
                {partners.map((p) => (
                  <li key={p.id} className="admin-partner-item">
                    <div>
                      <div className="admin-partner-name">{p.name}</div>
                      <div className="admin-partner-code">Код: {p.code}</div>
                    </div>
                    <button
                      onClick={() => handleDeletePartner(p.id)}
                      className="admin-button admin-button-danger"
                    >
                      Удалить
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Создание пользователя */}
          <div className="admin-card">
            <h2 className="admin-card-title">Создать пользователя</h2>
            <form onSubmit={handleCreateUser} className="admin-form">
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="admin-input"
                required
              />
              <input
                type="text"
                placeholder="Полное имя"
                value={newUser.full_name}
                onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                className="admin-input"
                required
              />
              <input
                type="password"
                placeholder="Пароль"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="admin-input"
                required
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'RECRUITER' | 'ADMIN' })}
                className="admin-select"
              >
                <option value="RECRUITER">Рекрутер</option>
                <option value="ADMIN">Администратор</option>
              </select>
              <button type="submit" className="admin-button admin-button-primary">
                Создать
              </button>
            </form>
          </div>

          {/* Список пользователей */}
          <div className="admin-card full-width">
            <h2 className="admin-card-title">Пользователи</h2>
            <div className="overflow-x-auto">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Имя</th>
                    <th>Роль</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>{u.email}</td>
                      <td>{u.full_name}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleChangeRole(u.id, e.target.value as 'RECRUITER' | 'ADMIN')}
                          className="admin-select"
                          style={{ padding: '0.25rem 1.5rem 0.25rem 0.5rem', fontSize: '0.8rem' }}
                        >
                          <option value="RECRUITER">Рекрутер</option>
                          <option value="ADMIN">Администратор</option>
                        </select>
                      </td>
                      <td>
                        <span className={`admin-badge ${u.is_active ? 'admin-badge-active' : 'admin-badge-inactive'}`}>
                          {u.is_active ? 'Активен' : 'Заблокирован'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleBlock(u)}
                          className={`admin-button ${u.is_active ? 'admin-button-danger' : 'admin-button-warning'}`}
                        >
                          {u.is_active ? 'Заблокировать' : 'Разблокировать'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
