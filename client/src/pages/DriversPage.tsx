import { useEffect, useState } from 'react';
import { AppNavbar } from '../components/Navbar';
import { driversApi } from '../lib/api';
import type { Driver } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

export default function DriversPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [licenseNumber, setLic] = useState('');
  const [rank, setRank] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);

  useEffect(() => {
    (async () => {
      const data = await driversApi.list();
      setItems(data);
      setLoading(false);
    })();
  }, []);

  async function addDriver(e: React.FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !licenseNumber.trim()) return;
    const created = await driversApi.create({ firstName, lastName, licenseNumber, rank, phone });
    // upload photo if provided
    if (photo) {
      try {
        const { photoUrl } = await driversApi.uploadPhoto(created.id, photo);
        created.photoUrl = photoUrl;
      } catch {
        // ignore upload errors for now
      }
    }
    setItems((prev) => [created, ...prev]);
    setFirst(''); setLast(''); setLic(''); setRank(''); setPhone(''); setPhoto(null);
  }

  return (
    <div className="container py-3 page-bg--drivers">
      <AppNavbar />
      <h1 className="h3 mb-3">Водії</h1>
      <div className="row g-3">
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
          <div className="col-12 col-lg-4">
            <div className="card h-100">
              <div className="card-body">
                <h2 className="h5 mb-3">Додати водія</h2>
                <form onSubmit={addDriver} className="driver-form">
                  <div className="row g-2">
                    <div className="col-12 col-md-6">
                      <label className="form-label">Ім'я *</label>
                      <input className="form-control" value={firstName} onChange={(e) => setFirst(e.target.value)} required />
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label">Прізвище *</label>
                      <input className="form-control" value={lastName} onChange={(e) => setLast(e.target.value)} required />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Номер посвідчення *</label>
                      <input className="form-control" value={licenseNumber} onChange={(e) => setLic(e.target.value)} required />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Звання</label>
                      <input className="form-control" value={rank} onChange={(e) => setRank(e.target.value)} />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Телефон</label>
                      <input className="form-control" value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Фото (необов'язково)</label>
                      <input className="form-control" type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                  <div className="d-flex gap-2 mt-3">
                    <button className="btn btn-primary" type="submit">Додати</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
        <div className="col-12 col-lg-8">
          {loading ? (
            <div className="text-center py-5">Завантаження…</div>
          ) : items.length ? (
            <div className="list-group driver-list">
              {items.map((d) => (
                <div key={d.id} className="list-group-item d-flex justify-content-between align-items-center driver-card">
                  <div className="d-flex align-items-center gap-3">
                    <Link to={`/drivers/${d.id}`} className="text-decoration-none d-flex align-items-center gap-3">
                      {d.photoUrl ? (
                        <img src={d.photoUrl} alt={`${d.lastName} ${d.firstName}`} width={56} height={56} className="rounded object-fit-cover" />
                      ) : (
                        <div className="rounded bg-secondary-subtle d-inline-flex align-items-center justify-content-center" style={{ width: 56, height: 56 }}>
                          <span className="text-secondary">N/A</span>
                        </div>
                      )}
                      <div className="fw-semibold">{d.lastName} {d.firstName}</div>
                    </Link>
                    <div className="text-secondary small">Посв.: {d.licenseNumber} {d.rank ? `• ${d.rank}` : ''}</div>
                    {d.phone && <div className="text-secondary small">Тел.: {d.phone}</div>}
                  </div>
                  {(user?.role === 'admin' || user?.role === 'superadmin') && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={async () => {
                        const ok = window.confirm(`Видалити водія ${d.lastName} ${d.firstName}?`);
                        if (!ok) return;
                        await driversApi.remove(d.id);
                        setItems((prev) => prev.filter((x) => x.id !== d.id));
                      }}
                    >
                      Видалити
                    </button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="alert alert-info">Поки що немає водіїв</div>
          )}
        </div>
      </div>
    </div>
  );
}
