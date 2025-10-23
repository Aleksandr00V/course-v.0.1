import { AppNavbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { usersApi, type SafeUser } from '../lib/api';

export default function CabinetPage() {
  const { user, logout, updateProfile } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [position, setPosition] = useState(user?.position || '');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // Для адмінів - список користувачів
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Для супер адміна - модальне вікно редагування
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [editPassword, setEditPassword] = useState('');
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);

  // Завантаження користувачів для адмінів
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      loadUsers();
    }
  }, [user]);

  async function loadUsers() {
    try {
      setLoadingUsers(true);
      const data = await usersApi.list();
      setUsers(data);
    } catch (e: any) {
      console.error('Помилка завантаження користувачів:', e);
    } finally {
      setLoadingUsers(false);
    }
  }

  function openEditModal(userToEdit: SafeUser) {
    setEditingUser(userToEdit);
    setEditEmail(userToEdit.email);
    setEditName(userToEdit.name || '');
    setEditPosition(userToEdit.position || '');
    setEditRole(userToEdit.role);
    setEditPassword('');
    setEditMsg(null);
    setEditErr(null);
  }

  async function saveUserChanges() {
    if (!editingUser) return;
    
    try {
      setEditErr(null);
      setEditMsg(null);
      
      const updateData: any = {
        email: editEmail,
        name: editName,
        position: editPosition,
        role: editRole,
      };
      
      if (editPassword) {
        updateData.password = editPassword;
      }
      
      await usersApi.update(editingUser.id, updateData);
      setEditMsg('Користувача оновлено успішно');
      await loadUsers(); // Перезавантажити список
      
      // Закрити модальне вікно через 1.5 секунди
      setTimeout(() => {
        setEditingUser(null);
      }, 1500);
      
    } catch (e: any) {
      setEditErr(e?.response?.data?.message || 'Помилка оновлення користувача');
    }
  }

  return (
    <div className="container py-3 page-bg--cabinet">
      <AppNavbar />
      <h1 className="h3 mb-3">Кабінет</h1>
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 mb-3">Профіль</h2>
              {user ? (
                <>
                  {err && <div className="alert alert-danger">{err}</div>}
                  {msg && <div className="alert alert-success">{msg}</div>}
                  <div className="mb-2"><span className="text-secondary small">Роль:</span> {user.role}</div>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    setErr(null); setMsg(null);
                    try {
                      await updateProfile({ email, name, position, password: password || undefined });
                      setMsg('Профіль оновлено');
                      setPassword('');
                    } catch (e: any) {
                      setErr(e?.response?.data?.message || 'Помилка оновлення');
                    }
                  }}>
                    <div className="mb-2">
                      <label className="form-label">Email</label>
                      <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Ім'я</label>
                      <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Посада</label>
                      <select className="form-control" value={position} onChange={(e) => setPosition(e.target.value)}>
                        <option value="">Оберіть посаду</option>
                        <option value="Водій">Водій</option>
                        <option value="Старший Водій">Старший Водій</option>
                        <option value="Механік водій">Механік водій</option>
                        <option value="Начальник автослужби">Начальник автослужби</option>
                        <option value="Старший технік автопарку">Старший технік автопарку</option>
                      </select>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Новий пароль</label>
                      <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Залиште порожнім, щоб не змінювати" />
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" type="submit">Зберегти</button>
                      <button className="btn btn-outline-secondary" type="button" onClick={logout}>Вийти</button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-secondary">Неавторизований користувач</div>
              )}
            </div>
          </div>
        </div>
        
        {/* Секція для адмінів - список користувачів */}
        {user && (user.role === 'admin' || user.role === 'superadmin') && (
          <div className="col-12">
            <div className="card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h2 className="h5 mb-0">Користувачі системи</h2>
                  <button 
                    className="btn btn-outline-primary btn-sm" 
                    onClick={loadUsers}
                    disabled={loadingUsers}
                  >
                    {loadingUsers ? 'Завантаження...' : 'Оновити'}
                  </button>
                </div>
                
                {loadingUsers ? (
                  <div className="text-center py-3">
                    <div className="spinner-border spinner-border-sm" role="status">
                      <span className="visually-hidden">Завантаження...</span>
                    </div>
                  </div>
                ) : users.length === 0 ? (
                  <div className="text-secondary">Користувачів не знайдено</div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Email</th>
                          <th>Ім'я</th>
                          <th>Посада</th>
                          <th>Роль</th>
                          {user.role === 'superadmin' && <th>Дії</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((usr) => (
                          <tr key={usr.id}>
                            <td>
                              {user.role === 'superadmin' ? (
                                <button 
                                  className="btn btn-link p-0 text-start"
                                  onClick={() => openEditModal(usr)}
                                  style={{ textDecoration: 'none' }}
                                >
                                  {usr.email}
                                </button>
                              ) : (
                                usr.email
                              )}
                            </td>
                            <td>{usr.name || '-'}</td>
                            <td>{usr.position || '-'}</td>
                            <td>
                              <span className={`badge ${
                                usr.role === 'superadmin' ? 'bg-danger' : 
                                usr.role === 'admin' ? 'bg-warning' : 'bg-primary'
                              }`}>
                                {usr.role === 'superadmin' ? 'Супер Адмін' : 
                                 usr.role === 'admin' ? 'Адмін' : 'Користувач'}
                              </span>
                            </td>
                            {user.role === 'superadmin' && (
                              <td>
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => openEditModal(usr)}
                                >
                                  Редагувати
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Модальне вікно редагування користувача (тільки для супер адміна) */}
      {editingUser && user?.role === 'superadmin' && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Редагування користувача</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setEditingUser(null)}
                ></button>
              </div>
              <div className="modal-body">
                {editErr && <div className="alert alert-danger">{editErr}</div>}
                {editMsg && <div className="alert alert-success">{editMsg}</div>}
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  saveUserChanges();
                }}>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input 
                      type="email"
                      className="form-control" 
                      value={editEmail} 
                      onChange={(e) => setEditEmail(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Ім'я</label>
                    <input 
                      className="form-control" 
                      value={editName} 
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Посада</label>
                    <select 
                      className="form-control" 
                      value={editPosition} 
                      onChange={(e) => setEditPosition(e.target.value)}
                    >
                      <option value="">Оберіть посаду</option>
                      <option value="Водій">Водій</option>
                      <option value="Старший Водій">Старший Водій</option>
                      <option value="Механік водій">Механік водій</option>
                      <option value="Начальник автослужби">Начальник автослужби</option>
                      <option value="Старший технік автопарку">Старший технік автопарку</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Роль</label>
                    <select 
                      className="form-control" 
                      value={editRole} 
                      onChange={(e) => setEditRole(e.target.value as 'user' | 'admin' | 'superadmin')}
                    >
                      <option value="user">Користувач</option>
                      <option value="admin">Адмін</option>
                      <option value="superadmin">Супер Адмін</option>
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Новий пароль</label>
                    <input 
                      type="password"
                      className="form-control" 
                      value={editPassword} 
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Залиште порожнім, щоб не змінювати"
                    />
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary">
                      Зберегти зміни
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setEditingUser(null)}
                    >
                      Скасувати
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
