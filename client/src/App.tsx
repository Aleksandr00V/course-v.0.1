import { useEffect, useMemo, useState } from 'react';
import { api } from './lib/api';
import type { Vehicle } from './types';
import { EquipmentForm as VehicleForm } from './components/EquipmentForm';
import { EquipmentList as VehicleList } from './components/EquipmentList';
import { AppNavbar } from './components/Navbar';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user } = useAuth();
  const [items, setItems] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<Vehicle | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) =>
      [i.make, i.model, i.type, i.registrationNumber, i.assignedUnit, i.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [items, query]);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.list();
        setItems(data);
      } catch (e: any) {
        setError(e?.message || 'Помилка завантаження');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCreate(payload: Omit<Vehicle, 'id'>) {
    const created = await api.create(payload);
    setItems((prev) => [created, ...prev]);
  }

  async function handleUpdate(id: string, update: Partial<Vehicle>) {
    const next = await api.update(id, update);
    setItems((prev) => prev.map((i) => (i.id === id ? next : i)));
    setEditing(null);
  }

  async function handleDelete(id: string) {
    await api.remove(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  return (
    <div className="container py-3 page-bg--vehicles">
      <AppNavbar />
      <header className="mb-3">
        <h1 className="h3 mb-2">Облік автомобільної техніки</h1>
        <p className="text-muted mb-0">Військова частина — внутрішній облік</p>
      </header>

      <div className="row g-3">
        {(user?.role === 'admin' || user?.role === 'superadmin') && (
        <div className="col-12 col-lg-4">
          <div className="card h-100">
            <div className="card-body">
              <h2 className="h5 mb-3">Додати транспортний засіб</h2>
              <VehicleForm
                key={editing ? `edit-${editing.id}` : 'create'}
                initial={editing || undefined}
                onSubmit={async (data) => {
                  if (editing) await handleUpdate(editing.id, data);
                  else await handleCreate(data as Omit<Vehicle, 'id'>);
                }}
                onCancel={() => setEditing(null)}
              />
            </div>
          </div>
        </div>
        )}

        <div className="col-12 col-lg-8">
          <div className="d-flex align-items-center gap-2 mb-2">
            <input
              className="form-control"
              placeholder="Пошук..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <span className="text-secondary small">{filtered.length} шт.</span>
          </div>

          {loading ? (
            <div className="text-center py-5">Завантаження…</div>
          ) : error ? (
            <div className="alert alert-danger">{error}</div>
          ) : (
            <VehicleList
              items={filtered}
              onEdit={(it: Vehicle) => setEditing(it)}
              onDelete={(id: string) => handleDelete(id)}
              canManage={user?.role === 'admin' || user?.role === 'superadmin'}
            />
          )}
        </div>
      </div>
    </div>
  );
}
