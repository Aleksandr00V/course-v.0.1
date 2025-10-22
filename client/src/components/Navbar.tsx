import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Theme = 'light' | 'dark';

export function AppNavbar() {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'light');
  const { user, logout } = useAuth();

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    document.body.classList.toggle('app-bg--dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <nav className={`navbar navbar-expand-lg mb-3 ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-light bg-body-tertiary'}`}>
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">ВЧ — Автопарк</Link>

        <button className="navbar-toggler" type="button" onClick={() => setOpen((v) => !v)}>
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`} to="/">Головна</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`} to="/vehicles">Транспорт</NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`} to="/cabinet">Кабінет</NavLink>
            </li>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <li className="nav-item">
                <NavLink className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`} to="/registrations">Реєстрації</NavLink>
              </li>
            )}
            {user?.role === 'superadmin' && (
              <li className="nav-item">
                <NavLink className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`} to="/users">Користувачі</NavLink>
              </li>
            )}
          </ul>
          <div className="d-flex align-items-center gap-3">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="themeSwitch"
                checked={theme === 'dark'}
                onChange={(e) => setTheme(e.target.checked ? 'dark' : 'light')}
              />
              <label className="form-check-label" htmlFor="themeSwitch">
                Тема: {theme === 'dark' ? 'Темна' : 'Світла'}
              </label>
            </div>
            {user ? (
              <div className="d-flex align-items-center gap-2">
                <span className="small text-secondary">{user.email} ({user.role})</span>
                <button className="btn btn-sm btn-outline-secondary" onClick={logout}>Вийти</button>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <NavLink className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`} to="/login">Вхід</NavLink>
                <NavLink className={({ isActive }: { isActive: boolean }) => `nav-link ${isActive ? 'active' : ''}`} to="/register">Реєстрація</NavLink>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
