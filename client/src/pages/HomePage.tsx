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
  
  // Модальне вікно для завершення поїздки
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState('');
  const [arriveAtInput, setArriveAtInput] = useState('');
  const [arriveError, setArriveError] = useState<string | null>(null);

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
    if (!vehicleId || !driverId || !from.trim() || !to.trim()) {
      setError('Заповніть всі обов\'язкові поля');
      return;
    }
    
    // Перевірка дати - не раніше сьогодні
    const selectedDate = departAt ? new Date(departAt) : new Date();
    const now = new Date();
    if (selectedDate < now) {
      setError('Дата та час виїзду не можуть бути раніше поточного моменту');
      return;
    }
    
    // Перевірка конфліктів - чи не зайняті водій та авто в той самий час
    const conflictRequest = requests.find(r => {
      if (r.status === 'done' || r.status === 'canceled') return false;
      
      const requestDate = new Date(r.departAt);
      const timeDiff = Math.abs(selectedDate.getTime() - requestDate.getTime());
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      // Перевіряємо конфлікт, якщо різниця менше 4 годин
      return (r.driverId === driverId || r.vehicleId === vehicleId) && hoursDiff < 4;
    });
    
    if (conflictRequest) {
      const conflictType = conflictRequest.driverId === driverId ? 'користувач' : 'автомобіль';
      const conflictTime = new Date(conflictRequest.departAt).toLocaleString();
      setError(`${conflictType} вже зайнятий поблизу цього часу (${conflictTime}). Мінімальний інтервал: 4 години`);
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
      
      // Якщо заявку завершено і є кілометраж, додаємо до пробігу авто
      if (updates.status === 'done' && updated.kilometers && updated.vehicleId) {
        try {
          // Отримуємо повні дані авто
          const fullVehicle = await vehiclesApi.get(updated.vehicleId);
          await vehiclesApi.update(updated.vehicleId, { 
            mileage: (fullVehicle.mileage || 0) + updated.kilometers 
          });
          // Оновлюємо локальний стан авто
          const updatedVehicles = await vehiclesApi.list();
          setVehicles(updatedVehicles.map(v => ({ 
            id: v.id, 
            make: v.make, 
            model: v.model, 
            registrationNumber: v.registrationNumber 
          })));
        } catch (e) {
          console.error('Не вдалося оновити пробіг авто:', e);
        }
      }
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
  
  function openCompleteModal(requestId: string) {
    setSelectedRequestId(requestId);
    
    // Знаходимо заявку та встановлюємо час приїзду як час виїзду + 30 хвилин
    const request = requests.find(r => r.id === requestId);
    let defaultArriveTime = new Date().toISOString().slice(0, 16);
    
    if (request) {
      const departTime = new Date(request.departAt);
      const arriveTime = new Date(departTime.getTime() + 30 * 60 * 1000); // +30 хвилин
      const now = new Date();
      
      // Якщо час виїзду + 30 хвилин не в майбутньому, використовуємо його
      if (arriveTime <= now) {
        defaultArriveTime = arriveTime.toISOString().slice(0, 16);
      }
    }
    
    setArriveAtInput(defaultArriveTime);
    setArriveError(null);
    setShowCompleteModal(true);
  }
  
  function closeCompleteModal() {
    setShowCompleteModal(false);
    setSelectedRequestId('');
    setArriveAtInput('');
    setArriveError(null);
  }
  
  async function handleCompleteTrip() {
    if (!arriveAtInput) {
      setArriveError('Введіть час приїзду');
      return;
    }
    
    const arriveDate = new Date(arriveAtInput);
    const request = requests.find(r => r.id === selectedRequestId);
    
    if (!request) {
      setArriveError('Заявку не знайдено');
      return;
    }
    
    const departDate = new Date(request.departAt);
    
    console.log('Debug info:');
    console.log('arriveAtInput:', arriveAtInput);
    console.log('arriveDate:', arriveDate);
    console.log('request.departAt:', request.departAt);
    console.log('departDate:', departDate);
    console.log('arriveDate < departDate:', arriveDate < departDate);
    
    // Перевіряємо, що час приїзду не раніше часу виїзду (порівнюємо мілісекунди)
    const arriveTime = arriveDate.getTime();
    const departTime = departDate.getTime();
    
    if (arriveTime < departTime) {
      setArriveError(`Час приїзду не може бути раніше часу виїзду (${departDate.toLocaleString()}). Ви ввели: ${arriveDate.toLocaleString()}`);
      return;
    }
    
    // Перевіряємо, що час приїзду не в майбутньому
    const now = new Date();
    if (arriveDate > now) {
      setArriveError('Час приїзду не може бути в майбутньому');
      return;
    }
    
    try {
      await updateRequest(selectedRequestId, { 
        arriveAt: arriveDate.toISOString(), 
        status: 'done' 
      });
      closeCompleteModal();
    } catch (e: any) {
      setArriveError(e?.response?.data?.message || 'Не вдалося завершити поїздку');
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
                          .filter(u => {
                            // Не показуємо користувачів, які вже мають активні заявки
                            return !requests.some(r => 
                              r.driverId === u.id && 
                              (r.status === 'planned' || r.status === 'in-progress')
                            );
                          })
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
                            {r.status !== 'done' && r.status !== 'canceled' && (
                              <button 
                                className="btn btn-sm btn-outline-success" 
                                onClick={() => openCompleteModal(r.id)}
                              >
                                Завершити поїздку
                              </button>
                            )}
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
      
      {/* Модальне вікно для завершення поїздки */}
      {showCompleteModal && (
        <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Завершити поїздку</h5>
                <button type="button" className="btn-close" onClick={closeCompleteModal}></button>
              </div>
              <div className="modal-body">
                {arriveError && <div className="alert alert-danger">{arriveError}</div>}
                <div className="mb-3">
                  <label className="form-label">Час приїзду</label>
                  <input 
                    type="datetime-local" 
                    className="form-control"
                    value={arriveAtInput}
                    onChange={(e) => setArriveAtInput(e.target.value)}
                    max={new Date().toISOString().slice(0, 16)}
                  />
                  <div className="form-text">
                    Час приїзду може дорівнювати часу виїзду (миттєва поїздка) або бути пізніше, але не в майбутньому
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCompleteModal}>
                  Скасувати
                </button>
                <button type="button" className="btn btn-success" onClick={handleCompleteTrip}>
                  Завершити поїздку
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
