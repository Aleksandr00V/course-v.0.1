import { AppNavbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';

export default function CabinetPage() {
  const { user, logout, updateProfile } = useAuth();
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState(user?.name || '');
  const [position, setPosition] = useState(user?.position || '');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
      </div>
    </div>
  );
}
