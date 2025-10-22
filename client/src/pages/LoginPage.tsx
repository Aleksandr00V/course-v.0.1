import { useState } from 'react';
import { AppNavbar } from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@local');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const u = await login(email, password);
      // Redirect by role: admins -> home, users -> cabinet
  if (u.role === 'admin' || u.role === 'superadmin') navigate('/vehicles');
  else navigate('/cabinet');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка входу');
    }
  }

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!user) return;
  if (user.role === 'admin' || user.role === 'superadmin') navigate('/vehicles');
    else navigate('/cabinet');
  }, [user, navigate]);

  return (
    <div className="container py-3 page-bg--login">
      <AppNavbar />
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card">
            <div className="card-body">
              <h1 className="h4 mb-3">Вхід</h1>
              {error && <div className="alert alert-danger">{error}</div>}
              <form onSubmit={onSubmit}>
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label">Пароль</label>
                  <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button className="btn btn-primary w-100" type="submit">Увійти</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
