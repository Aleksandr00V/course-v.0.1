import { AppNavbar } from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { requestsApi, api as vehiclesApi, driversApi, usersApi } from '../lib/api';
import type { RequestItem, SafeUser } from '../lib/api';

export default function HomePage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Array<{ id: string; make: string; model: string; registrationNumber: string }>>([]);
  const [users, setUsers] = useState<SafeUser[]>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departAt, setDepartAt] = useState('');
  const [kilometers, setKilometers] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [vs, us] = await Promise.all([vehiclesApi.list(), usersApi.list()]);
        setVehicles(vs.map(v => ({ id: v.id, make: v.make, model: v.model, registrationNumber: v.registrationNumber })));
        setUsers(us);
        if (user?.role === 'admin' || user?.role === 'superadmin') {
          const rs = await requestsApi.list();
          setRequests(rs);
        }
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Помилка завантаження');
      }
    })();
  }, [user?.role]);

  async function createRequest(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!vehicleId || !driverId || !from.trim() || !to.trim()) return;
    
    // Перевірка дати - не раніше сьогодні
    const selectedDate = departAt ? new Date(departAt) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Дата виїзду не може бути раніше сьогодні');
      return;
    }
    
    // Перевірка, що на обрану дату немає активних поїздок для цього водія чи авто
    const selectedDateOnly = new Date(selectedDate);
    selectedDateOnly.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDateOnly);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const conflictRequest = requests.find(r => {
      const requestDate = new Date(r.departAt);
      requestDate.setHours(0, 0, 0, 0);
      return (
        (r.driverId === driverId || r.vehicleId === vehicleId) &&
        (r.status === 'planned' || r.status === 'in-progress') &&
        requestDate.getTime() === selectedDateOnly.getTime()
      );
    });
    
    if (conflictRequest) {
      const conflictType = conflictRequest.driverId === driverId ? 'користувач' : 'автомобіль';
      setError(`Цей ${conflictType} уже має активну поїздку на цю дату`);
      return;
    }
    
    const iso = selectedDate.toISOString();
    const payload = { 
      vehicleId, 
      driverId, 
      from, 
      to, 
      departAt: iso, 
      kilometers: kilometers ? parseInt(kilometers) : undefined,
      notes: '' 
    };
    try {
      const created = await requestsApi.create(payload as any);
      setRequests((prev) => [created, ...prev]);
      setVehicleId(''); setDriverId(''); setFrom(''); setTo(''); setDepartAt(''); setKilometers('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка створення заявки');
    }
  }
  function nameVehicle(id: string) {
    const v = vehicles.find(x => x.id === id);
    return v ? `${v.make} ${v.model} (${v.registrationNumber})` : id;
  }
  function nameUser(id: string) {
    const u = users.find(x => x.id === id);
    return u ? `${u.name || u.email}` : id;
  }
  async function updateRequest(id: string, updates: Partial<RequestItem>) {
    try {
      const updated = await requestsApi.update(id, updates);
      setRequests((prev) => prev.map(r => r.id === id ? updated : r));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Не вдалося оновити заявку');
    }
  }
  async function deleteRequest(id: string) {
    try {
      await requestsApi.remove(id);
      setRequests((prev) => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Не вдалося видалити заявку');
    }
  }
  return (
    <div className="container py-3">
      <AppNavbar />
      <div className="row g-3">
        <div className="col-12">
          <h1 className="h3 mb-2">Інформаційна система обліку автомобільної техніки</h1>
          <p className="text-muted">ВЧ — внутрішній облік транспорту та водіїв</p>
        </div>
        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h5">Транспорт</h2>
              <p className="mb-3">Додавання, редагування та пошук транспортних засобів.</p>
              <Link className="btn btn-primary" to="/vehicles">Відкрити</Link>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-6">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h5">Водії</h2>
              <p className="mb-3">Облік водіїв, контактні дані, фото, права керування.</p>
              <Link className="btn btn-outline-primary" to="/drivers">Відкрити</Link>
            </div>
          </div>
        </div>
        <div className="col-12">
          <div className="card">
            <div className="card-body">
              <h2 className="h6 mb-3">Як це працює?</h2>
              <ol className="mb-0">
                <li>Зареєструйтесь: нові користувачі потрапляють у чергу на підтвердження.</li>
                <li>Адмін або супер-адмін підтверджує обліковий запис.</li>
                <li>Користувач входить і отримує доступ до відповідних розділів за роллю.</li>
                <li>Адміни керують транспортом, водіями та користувачами (для супер-адміна).</li>
              </ol>
            </div>
          </div>
        </div>
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <>
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h2 className="h6 mb-3">Заявка на виїзд</h2>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <form className="row g-2" onSubmit={createRequest}>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Авто</label>
                      <select className="form-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                        <option value="">— Оберіть авто —</option>
                        {vehicles.map(v => (
                          <option key={v.id} value={v.id}>{v.make} {v.model} — № {v.registrationNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Користувач</label>
                      <select className="form-select" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                        <option value="">— Оберіть користувача —</option>
                        {users
                          .filter(u => !requests.some(r => 
                            r.driverId === u.id && 
                            (r.status === 'planned' || r.status === 'in-progress')
                          ))
                          .map(u => (
                          <option key={u.id} value={u.id}>{u.name || u.email}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Час виїзду</label>
                      <input 
                        className="form-control" 
                        type="datetime-local" 
                        value={departAt} 
                        min={new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setDepartAt(e.target.value)} 
                      />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Звідки</label>
                      <input className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Куди</label>
                      <input className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Кілометраж</label>
                      <input className="form-control" type="number" placeholder="км" value={kilometers} onChange={(e) => setKilometers(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <button className="btn btn-primary" type="submit">Створити заявку</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-12">
              <div className="card">
                <div className="card-body">
                  <h2 className="h6 mb-3">Поточні заявки</h2>
                  {requests.length ? (
                    <div className="list-group">
                      {requests.map(r => {
                        const actions = (
                          <div className="d-flex gap-1">
                            <button 
                              className="btn btn-sm btn-outline-primary" 
                              onClick={() => {
                                const newArriveAt = prompt('Введіть час приїзду (YYYY-MM-DD HH:MM):', 
                                  new Date().toISOString().slice(0, 16).replace('T', ' '));
                                if (newArriveAt) {
                                  const isoDate = new Date(newArriveAt).toISOString();
                                  updateRequest(r.id, { arriveAt: isoDate, status: 'done' });
                                }
                              }}
                              disabled={r.status === 'done' || r.status === 'canceled'}
                            >
                              Редагувати
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger" 
                              onClick={() => {
                                if (confirm('Видалити цю заявку?')) {
                                  deleteRequest(r.id);
                                }
                              }}
                            >
                              Видалити
                            </button>
                          </div>
                        );
                        return (
                          <div key={r.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-semibold">{new Date(r.departAt).toLocaleString()} — {nameVehicle(r.vehicleId)}</div>
                              <div className="text-secondary small">
                                {nameUser(r.driverId)} · {r.from} → {r.to}
                                {r.kilometers && ` · ${r.kilometers} км`}
                                {r.arriveAt && ` · Приїхав: ${new Date(r.arriveAt).toLocaleString()}`}
                              </div>
                            </div>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge text-bg-secondary text-capitalize">{r.status}</span>
                              {actions}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-secondary">Немає активних заявок</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
