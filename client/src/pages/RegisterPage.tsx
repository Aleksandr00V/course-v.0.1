import { useState } from 'react';
import { AppNavbar } from '../components/Navbar';
import axios from 'axios';

const http = axios.create({ baseURL: 'https://course-v-0-1-2.onrender.com/api' });

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [position, setPosition] = useState('');
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({ email: '', password: '', lastName: '', firstName: '', middleName: '', position: '' });

  function validateFields() {
    const errors: { email: string; password: string; lastName: string; firstName: string; middleName: string; position: string } = { email: '', password: '', lastName: '', firstName: '', middleName: '', position: '' };
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const namePattern = /^[^0-9]+$/; // No digits allowed

    if (!emailPattern.test(email)) {
      errors.email = 'Невірний формат email';
    }
    if (password.length < 8) {
      errors.password = 'Пароль має бути не менше 8 символів';
    }
    if (!namePattern.test(lastName)) {
      errors.lastName = 'Прізвище не повинно містити цифр';
    }
    if (!namePattern.test(firstName)) {
      errors.firstName = 'Ім\'я не повинно містити цифр';
    }
    if (!namePattern.test(middleName)) {
      errors.middleName = 'По батькові не повинно містити цифр';
    }
    if (!position) {
      errors.position = 'Посада є обов\'язковою';
    }

    setFieldErrors(errors);
    return !errors.email && !errors.password && !errors.lastName && !errors.firstName && !errors.middleName && !errors.position;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!validateFields()) return;
    try {
      await http.post('/auth/register', { email, password, lastName, firstName, middleName, position });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка реєстрації');
    }
  }

  return (
    <div className="container py-3 page-bg--login">
      <AppNavbar />
      <div className="row justify-content-center">
        <div className="col-12 col-md-6 col-lg-4">
          <div className="card">
            <div className="card-body">
              <h1 className="h4 mb-3">Реєстрація</h1>
              {done ? (
                <div className="alert alert-success">Заявку на реєстрацію надіслано. Після підтвердження адміністрацією ви зможете увійти.</div>
              ) : (
                <form onSubmit={onSubmit}>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {fieldErrors.email && <div className="invalid-feedback">{fieldErrors.email}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Пароль</label>
                    <input
                      type="password"
                      className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    {fieldErrors.password && <div className="invalid-feedback">{fieldErrors.password}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Прізвище</label>
                    <input
                      className={`form-control ${fieldErrors.lastName ? 'is-invalid' : ''}`}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                    />
                    {fieldErrors.lastName && <div className="invalid-feedback">{fieldErrors.lastName}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Ім'я</label>
                    <input
                      className={`form-control ${fieldErrors.firstName ? 'is-invalid' : ''}`}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                    {fieldErrors.firstName && <div className="invalid-feedback">{fieldErrors.firstName}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">По батькові</label>
                    <input
                      className={`form-control ${fieldErrors.middleName ? 'is-invalid' : ''}`}
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                    />
                    {fieldErrors.middleName && <div className="invalid-feedback">{fieldErrors.middleName}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Посада</label>
                    <select
                      className={`form-control ${fieldErrors.position ? 'is-invalid' : ''}`}
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                    >
                      <option value="">Оберіть посаду</option>
                      <option value="Водій">Водій</option>
                      <option value="Старший Водій">Старший Водій</option>
                      <option value="Механік водій">Механік водій</option>
                      <option value="Начальник автослужби">Начальник автослужби</option>
                      <option value="Старший технік автопарку">Старший технік автопарку</option>
                    </select>
                    {fieldErrors.position && <div className="invalid-feedback">{fieldErrors.position}</div>}
                  </div>
                  <button className="btn btn-primary w-100" type="submit">Надіслати на підтвердження</button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
