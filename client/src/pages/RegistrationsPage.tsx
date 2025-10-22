import { useEffect, useState } from 'react';
import { AppNavbar } from '../components/Navbar';
import { registrationsApi } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

export default function RegistrationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Array<{ id: string; email: string; name?: string; role: string; status?: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await registrationsApi.listPending();
        setItems(data);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
    return (
      <div className="container py-3">
        <AppNavbar />
        <div className="alert alert-danger">Доступ лише для адміністрації</div>
      </div>
    );
  }

  async function approve(id: string) {
    try {
      await registrationsApi.approve(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка підтвердження');
    }
  }

  async function reject(id: string) {
    try {
      await registrationsApi.reject(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Помилка відхилення');
    }
  }

  return (
    <div className="container py-3">
      <AppNavbar />
      <h1 className="h4 mb-3">Заявки на реєстрацію</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      {loading ? (
        <div className="text-center py-5">Завантаження…</div>
      ) : items.length ? (
        <div className="list-group">
          {items.map((u) => (
            <div key={u.id} className="list-group-item d-flex align-items-center justify-content-between">
              <div>
                <div className="fw-semibold">{u.email}</div>
                <div className="text-secondary small">{u.name || '—'} {u.status ? `• ${u.status}` : ''}</div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-success" onClick={() => approve(u.id)}>Підтвердити</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => reject(u.id)}>Відхилити</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="alert alert-info">Немає нових заявок</div>
      )}
    </div>
  );
}
