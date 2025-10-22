import type { Vehicle } from '../types';
import { Link } from 'react-router-dom';

type Props = {
  items: Vehicle[];
  onEdit: (item: Vehicle) => void;
  onDelete: (id: string) => void;
  canManage?: boolean;
};

export function EquipmentList({ items, onEdit, onDelete, canManage = true }: Props) {
  if (!items.length) {
    return <div className="alert alert-info">Нічого не знайдено</div>;
  }

  return (
    <div className="vehicle-list list-group">
      {items.map((it) => (
        <div key={it.id} className={`list-group-item vehicle-card ${it.status === 'repair' ? 'vehicle-card--alert' : ''}`}>
          <div className="row g-2 align-items-center">
            <div className="col-12 col-md-6">
              <Link to={`/vehicles/${it.id}`} className="text-decoration-none">
                <div className="vehicle-card__title fw-semibold">{it.make} {it.model}</div>
                <div className="text-secondary small">{it.type || '—'}</div>
              </Link>
            </div>
            <div className="col-6 col-md-2">
              <span className={`badge text-bg-${statusColor(it.status)}`}>{statusLabel(it.status)}</span>
            </div>
            <div className="col-6 col-md-2 text-md-center">
              {it.assignedUnit ? <span className="small">{it.assignedUnit}</span> : <span className="text-muted small">—</span>}
            </div>
            <div className="col-12 col-md-2 d-flex gap-2 justify-content-md-end">
              {canManage && (
                <>
                  <button className="btn btn-sm btn-outline-primary" onClick={() => onEdit(it)}>
                    Редагувати
                  </button>
                  <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(it.id)}>
                    Видалити
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="small mt-1 d-flex flex-wrap gap-2">
            <span className="text-secondary">№ {it.registrationNumber}</span>
            {it.year ? <span className="text-secondary">Рік: {it.year}</span> : null}
            {typeof it.mileage === 'number' ? <span className="text-secondary">Пробіг: {it.mileage} км</span> : null}
          </div>
          {it.vin && <div className="text-secondary small mt-1">VIN: {it.vin}</div>}
          {it.notes && <div className="small mt-1">{it.notes}</div>}
        </div>
      ))}
    </div>
  );
}

function statusColor(status: string): string {
  // accept legacy statuses as well
  switch (status) {
    case 'base':
      return 'success';
    case 'trip':
      return 'primary';
    case 'repair':
      return 'danger';
    case 'in-service':
    case 'decommissioned':
      return 'success';
    default:
      return 'light';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'base':
      return 'На базі';
    case 'trip':
      return 'На виїзді';
    case 'repair':
      return 'В ремонті';
    case 'in-service':
    case 'decommissioned':
      return 'На базі';
    default:
      return status;
  }
}
