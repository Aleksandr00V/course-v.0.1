import { AppNavbar } from '../components/Navbar';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { requestsApi, api as vehiclesApi, driversApi } from '../lib/api';
import type { RequestItem } from '../lib/api';

export default function HomePage() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState<Array<{ id: string; make: string; model: string; registrationNumber: string }>>([]);
  const [drivers, setDrivers] = useState<Array<{ id: string; firstName: string; lastName: string }>>([]);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departAt, setDepartAt] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [vs, ds] = await Promise.all([vehiclesApi.list(), driversApi.list()]);
        setVehicles(vs.map(v => ({ id: v.id, make: v.make, model: v.model, registrationNumber: v.registrationNumber })));
        setDrivers(ds.map(d => ({ id: d.id, firstName: d.firstName, lastName: d.lastName })));
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
    const iso = departAt ? new Date(departAt).toISOString() : new Date().toISOString();
    const payload = { vehicleId, driverId, from, to, departAt: iso, notes: '' };
    try {
      const created = await requestsApi.create(payload as any);
      setRequests((prev) => [created, ...prev]);
      setVehicleId(''); setDriverId(''); setFrom(''); setTo(''); setDepartAt('');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка створення заявки');
    }
  }
  function nameVehicle(id: string) {
    const v = vehicles.find(x => x.id === id);
    return v ? `${v.make} ${v.model} (${v.registrationNumber})` : id;
  }
  function nameDriver(id: string) {
    const d = drivers.find(x => x.id === id);
    return d ? `${d.lastName} ${d.firstName}` : id;
  }
  async function setStatus(id: string, status: RequestItem['status']) {
    try {
      const next = await requestsApi.update(id, { status });
      setRequests((prev) => prev.map(r => r.id === id ? next : r));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Не вдалося оновити статус');
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
                      <label className="form-label">Водій</label>
                      <select className="form-select" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                        <option value="">— Оберіть водія —</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.lastName} {d.firstName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-12 col-md-4">
                      <label className="form-label">Час виїзду</label>
                      <input className="form-control" type="datetime-local" value={departAt} onChange={(e) => setDepartAt(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Звідки</label>
                      <input className="form-control" value={from} onChange={(e) => setFrom(e.target.value)} />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Куди</label>
                      <input className="form-control" value={to} onChange={(e) => setTo(e.target.value)} />
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
                            {r.status === 'planned' && (
                              <button className="btn btn-sm btn-outline-primary" onClick={() => setStatus(r.id, 'in-progress')}>Старт</button>
                            )}
                            {r.status !== 'done' && (
                              <button className="btn btn-sm btn-outline-success" onClick={() => setStatus(r.id, 'done')}>Завершити</button>
                            )}
                            {r.status !== 'canceled' && (
                              <button className="btn btn-sm btn-outline-danger" onClick={() => setStatus(r.id, 'canceled')}>Скасувати</button>
                            )}
                          </div>
                        );
                        return (
                          <div key={r.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                              <div className="fw-semibold">{new Date(r.departAt).toLocaleString()} — {nameVehicle(r.vehicleId)}</div>
                              <div className="text-secondary small">{nameDriver(r.driverId)} · {r.from} → {r.to}</div>
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
