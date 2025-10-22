import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppNavbar } from '../components/Navbar';
import { api as vehiclesApi, tripsApi, driversApi } from '../lib/api';
import type { Trip, Vehicle, Driver } from '../types';

export default function VehicleDetailsPage() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        if (!id) return;
        const [v, ts, ds] = await Promise.all([
          vehiclesApi.get(id),
          tripsApi.list({ vehicleId: id }),
          driversApi.list(),
        ]);
        setVehicle(v);
        setTrips(ts);
        setDrivers(ds);
      } catch (e: any) {
        setErr(e?.response?.data?.message || 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const totalsByDriver = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of trips) map.set(t.driverId, (map.get(t.driverId) || 0) + (t.distanceKm || 0));
    return Array.from(map.entries()).map(([driverId, km]) => ({ driverId, km }));
  }, [trips]);

  const totalKm = useMemo(() => trips.reduce((s, t) => s + (t.distanceKm || 0), 0), [trips]);

  function driverName(id: string) {
    const d = drivers.find((x) => x.id === id);
    return d ? `${d.lastName} ${d.firstName}` : id;
  }

  return (
    <div className="container py-3">
      <AppNavbar />
      {loading ? (
        <div className="text-center py-5">Завантаження…</div>
      ) : err ? (
        <div className="alert alert-danger">{err}</div>
      ) : !vehicle ? (
        <div className="alert alert-warning">Авто не знайдено</div>
      ) : (
        <div className="row g-3">
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <h1 className="h5 mb-2">{vehicle.make} {vehicle.model}</h1>
                <div className="text-secondary small">№ {vehicle.registrationNumber}</div>
                {vehicle.type && <div className="text-secondary small">Тип: {vehicle.type}</div>}
                {vehicle.assignedUnit && <div className="text-secondary small">Підрозділ: {vehicle.assignedUnit}</div>}
                <div className="mt-3">
                  <div className="small text-secondary">Загалом кілометрів:</div>
                  <div className="h5 mb-0">{totalKm} км</div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 col-lg-8">
            <div className="card mb-3">
              <div className="card-body">
                <h2 className="h6 mb-3">Останні поїздки</h2>
                {trips.length ? (
                  <div className="list-group">
                    {trips.map((t) => (
                      <div key={t.id} className="list-group-item d-flex justify-content-between">
                        <div>
                          <div className="fw-semibold">{new Date(t.date).toLocaleString()}</div>
                          <div className="text-secondary small">Дистанція: {t.distanceKm} км</div>
                        </div>
                        <div>
                          <Link to={`/drivers/${t.driverId}`} className="small">Переглянути водія</Link>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">Немає поїздок</div>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-body">
                <h2 className="h6 mb-3">Пробіг за водіями</h2>
                {totalsByDriver.length ? (
                  <div className="list-group">
                    {totalsByDriver.map(({ driverId, km }) => (
                      <div key={driverId} className="list-group-item d-flex justify-content-between">
                        <div>{driverName(driverId)}</div>
                        <div className="fw-semibold">{km} км</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-secondary">Дані відсутні</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
