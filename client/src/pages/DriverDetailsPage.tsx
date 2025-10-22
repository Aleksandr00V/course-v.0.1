import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppNavbar } from '../components/Navbar';
import { driversApi, tripsApi, api as vehiclesApi } from '../lib/api';
import type { Driver, Trip, Vehicle } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function DriverDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState('');
  const [distanceKm, setDistanceKm] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        const [d, ts, vs] = await Promise.all([
          driversApi.get(id),
          tripsApi.list({ driverId: id }),
          vehiclesApi.list(),
        ]);
        setDriver(d);
        setTrips(ts);
        setVehicles(vs);
      } catch (e: any) {
        setErr(e?.response?.data?.message || 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalKm = useMemo(() => trips.reduce((s, t) => s + (t.distanceKm || 0), 0), [trips]);

  async function addTrip(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !vehicleId || distanceKm === '' || Number(distanceKm) <= 0) return;
    const created = await tripsApi.create({ driverId: id, vehicleId, distanceKm: Number(distanceKm), notes });
    setTrips((prev) => [created, ...prev]);
    setVehicleId(''); setDistanceKm(''); setNotes('');
  }

  return (
    <div className="container py-3">
      <AppNavbar />
      {loading ? (
        <div className="text-center py-5">Завантаження…</div>
      ) : err ? (
        <div className="alert alert-danger">{err}</div>
      ) : !driver ? (
        <div className="alert alert-warning">Водія не знайдено</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <div className="d-flex align-items-center gap-3">
                  {driver.photoUrl ? (
                    <img src={driver.photoUrl} alt={`${driver.lastName} ${driver.firstName}`} width={96} height={96} className="rounded object-fit-cover" />
                  ) : (
                    <div className="rounded bg-secondary-subtle d-inline-flex align-items-center justify-content-center" style={{ width: 96, height: 96 }}>
                      <span className="text-secondary">N/A</span>
                    </div>
                  )}
                  <div>
                    <h1 className="h5 mb-0">{driver.lastName} {driver.firstName}</h1>
                    <div className="text-secondary small">Посв.: {driver.licenseNumber}</div>
                    {driver.rank && <div className="text-secondary small">Звання: {driver.rank}</div>}
                    {driver.phone && <div className="text-secondary small">Тел.: {driver.phone}</div>}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="small text-secondary">Загалом кілометрів:</div>
                  <div className="h5 mb-0">{totalKm} км</div>
                </div>
              </div>
            </div>
            {(user?.role === 'admin' || user?.role === 'superadmin') && (
              <div className="card mt-3">
                <div className="card-body">
                  <h2 className="h6 mb-3">Додати поїздку</h2>
                  <form onSubmit={addTrip}>
                    <div className="mb-2">
                      <label className="form-label">Транспорт</label>
                      <select className="form-select" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                        <option value="">— Оберіть авто —</option>
                        {vehicles.map((v) => (
                          <option key={v.id} value={v.id}>{v.make} {v.model} — № {v.registrationNumber}</option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Дистанція, км</label>
                      <input className="form-control" type="number" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value ? Number(e.target.value) : '')} />
                    </div>
                    <div className="mb-2">
                      <label className="form-label">Нотатки</label>
                      <input className="form-control" value={notes} onChange={(e) => setNotes(e.target.value)} />
                    </div>
                    <button className="btn btn-primary" type="submit">Додати</button>
                  </form>
                </div>
              </div>
            )}
          </div>
          <div className="col-12 col-lg-8">
            <div className="card">
              <div className="card-body">
                <h2 className="h6 mb-3">Останні виїзди</h2>
                {trips.length ? (
                  <div className="list-group">
                    {trips.map((t) => (
                      <div key={t.id} className="list-group-item">
                        <div className="d-flex justify-content-between">
                          <div>
                            <div className="fw-semibold">{new Date(t.date).toLocaleString()}</div>
                            <div className="text-secondary small">Дистанція: {t.distanceKm} км</div>
                          </div>
                          <div>
                            <Link to={`/vehicles/${t.vehicleId}`} className="small">Переглянути авто</Link>
                          </div>
                        </div>
                        {t.notes && <div className="small mt-1">{t.notes}</div>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">Немає поїздок</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
