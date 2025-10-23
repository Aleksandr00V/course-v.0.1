import { useEffect, useState } from 'react';
import { AppNavbar } from '../components/Navbar';
import { usersApi, type SafeUser } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<SafeUser['role']>('user');
  const [position, setPosition] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Для супер адміна - модальне вікно редагування
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [editName, setEditName] = useState('');
  const [editPosition, setEditPosition] = useState('');
  const [editRole, setEditRole] = useState<'user' | 'admin' | 'superadmin'>('user');
  const [editPassword, setEditPassword] = useState('');
  const [editMsg, setEditMsg] = useState<string | null>(null);
  const [editErr, setEditErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await usersApi.list();
        setItems(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user || (user.role !== 'superadmin' && user.role !== 'admin')) {
    return (
      <div className="container py-3">
        <AppNavbar />
        <div className="alert alert-danger">Доступ лише для адміністратора</div>
      </div>
    );
  }

  async function addUser(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) return;
    try {
      const created = await usersApi.create({ email, password, name, role, position });
      setItems((prev) => [created, ...prev]);
      setEmail(''); setPassword(''); setName(''); setRole('user'); setPosition('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка створення користувача');
    }
  }

  async function changePosition(u: SafeUser, nextPosition: string) {
    try {
      const updated = await usersApi.update(u.id, { position: nextPosition });
      setItems((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка зміни посади');
    }
  }

  async function changeRole(u: SafeUser, nextRole: SafeUser['role']) {
    try {
      const updated = await usersApi.update(u.id, { role: nextRole });
      setItems((prev) => prev.map((x) => (x.id === u.id ? updated : x)));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка зміни ролі');
    }
  }

  async function removeUser(u: SafeUser) {
    const ok = window.confirm(`Видалити користувача ${u.email}?`);
    if (!ok) return;
    try {
      await usersApi.remove(u.id);
      setItems((prev) => prev.filter((x) => x.id !== u.id));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка видалення користувача');
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
      
      const updated = await usersApi.update(editingUser.id, updateData);
      setEditMsg('Користувача оновлено успішно');
      setItems((prev) => prev.map((x) => (x.id === editingUser.id ? updated : x)));
      
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
      <h1 className="h4 mb-3">Користувачі</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      <div className="row g-3">
        {user.role === 'superadmin' && (
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <h2 className="h6 mb-3">Створити користувача</h2>
                <form onSubmit={addUser}>
                <div className="mb-2">
                  <label className="form-label">Email *</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Пароль *</label>
                  <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="mb-2">
                  <label className="form-label">Ім'я</label>
                  <input className="form-control" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="mb-2">
                  <label className="form-label">Роль *</label>
                  <select className="form-select" value={role} onChange={(e) => setRole(e.target.value as SafeUser['role'])}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                </div>
                <div className="mb-2">
                  <label className="form-label">Посада</label>
                  <select className="form-select" value={position} onChange={(e) => setPosition(e.target.value)}>
                    <option value="">Оберіть посаду</option>
                    <option value="Водій">Водій</option>
                    <option value="Старший Водій">Старший Водій</option>
                    <option value="Механік водій">Механік водій</option>
                    <option value="Начальник автослужби">Начальник автослужби</option>
                    <option value="Старший технік автопарку">Старший технік автопарку</option>
                  </select>
                </div>
                <button className="btn btn-primary" type="submit">Створити</button>
              </form>
            </div>
          </div>
        </div>
        )}
        <div className={user.role === 'superadmin' ? 'col-12 col-lg-8' : 'col-12'}>
          {loading ? (
            <div className="text-center py-5">Завантаження…</div>
          ) : (
            <div className="list-group">
              {items.map((u) => (
                <div key={u.id} className="list-group-item d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-semibold">
                      {user.role === 'superadmin' ? (
                        <button 
                          className="btn btn-link p-0 text-start fw-semibold"
                          onClick={() => openEditModal(u)}
                          style={{ textDecoration: 'none', cursor: 'pointer' }}
                        >
                          {u.email}
                        </button>
                      ) : (
                        u.email
                      )}
                    </div>
                    <div className="text-secondary small">{u.name || '—'}</div>
                    <div className="text-secondary small">{u.position || '—'}</div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {user.role === 'superadmin' ? (
                      <select className="form-select form-select-sm" value={u.role} onChange={(e) => changeRole(u, e.target.value as SafeUser['role'])}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    ) : (
                      <span className={`badge ${
                        u.role === 'superadmin' ? 'bg-danger' : 
                        u.role === 'admin' ? 'bg-warning' : 'bg-primary'
                      }`}>
                        {u.role}
                      </span>
                    )}
                    <select className="form-select form-select-sm" value={u.position || ''} onChange={(e) => changePosition(u, e.target.value)}>
                      <option value="">Оберіть посаду</option>
                      <option value="Водій">Водій</option>
                      <option value="Старший Водій">Старший Водій</option>
                      <option value="Механік водій">Механік водій</option>
                      <option value="Начальник автослужби">Начальник автослужби</option>
                      <option value="Старший технік автопарку">Старший технік автопарку</option>
                    </select>
                    {user.role === 'superadmin' && (
                      <>
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(u)}>Редагувати</button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => removeUser(u)}>Видалити</button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
