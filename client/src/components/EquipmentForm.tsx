import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Vehicle, VehicleStatus } from '../types';

type Props = {
  initial?: Vehicle;
  onSubmit: (data: Omit<Vehicle, 'id'>) => void | Promise<void>;
  onCancel?: () => void;
};

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
  { value: 'base', label: 'На базі' },
  { value: 'trip', label: 'На виїзді' },
  { value: 'repair', label: 'В ремонті' },
];

export function EquipmentForm({ initial, onSubmit, onCancel }: Props) {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [type, setType] = useState('');
  const [status, setStatus] = useState<VehicleStatus>('base');
  const [assignedUnit, setAssignedUnit] = useState('');
  const [vin, setVin] = useState('');
  const [year, setYear] = useState<number | ''>('');
  const [mileage, setMileage] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initial) {
      setMake(initial.make || '');
      setModel(initial.model || '');
      setRegistrationNumber(initial.registrationNumber || '');
      setType(initial.type || '');
      const legacy = String(initial.status || '').toLowerCase();
      const mapped: VehicleStatus = legacy === 'repair' ? 'repair' : legacy === 'trip' ? 'trip' : 'base';
      setStatus(mapped);
      setAssignedUnit(initial.assignedUnit || '');
      setVin(initial.vin || '');
      setYear(initial.year ?? '');
      setMileage(initial.mileage ?? '');
      setNotes(initial.notes || '');
    }
  }, [initial]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!make.trim() || !model.trim() || !registrationNumber.trim()) return;
    setBusy(true);
    try {
      await onSubmit({
        make,
        model,
        registrationNumber,
        type,
        status,
        assignedUnit,
        vin,
        year: year === '' ? undefined : Number(year),
        mileage: mileage === '' ? undefined : Number(mileage),
        notes,
      } as Omit<Vehicle, 'id'>);
      if (!initial) {
        setMake('');
        setModel('');
        setRegistrationNumber('');
        setType('');
  setStatus('base');
        setAssignedUnit('');
        setVin('');
        setYear('');
        setMileage('');
        setNotes('');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="vehicle-form" onSubmit={submit}>
      <div className="row g-2">
        <div className="col-12">
          <label className="form-label">Марка *</label>
          <input className="form-control" value={make} onChange={(e) => setMake(e.target.value)} required />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Модель *</label>
          <input className="form-control" value={model} onChange={(e) => setModel(e.target.value)} required />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Держномер *</label>
          <input className="form-control" value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} required />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Тип</label>
          <input className="form-control" value={type} onChange={(e) => setType(e.target.value)} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Статус</label>
          <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value as VehicleStatus)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">Підрозділ</label>
          <input className="form-control" value={assignedUnit} onChange={(e) => setAssignedUnit(e.target.value)} />
        </div>
        <div className="col-12 col-md-6">
          <label className="form-label">VIN</label>
          <input className="form-control" value={vin} onChange={(e) => setVin(e.target.value)} />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">Рік</label>
          <input className="form-control" type="number" value={year} onChange={(e) => setYear(e.target.value ? Number(e.target.value) : '')} />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label">Пробіг, км</label>
          <input className="form-control" type="number" value={mileage} onChange={(e) => setMileage(e.target.value ? Number(e.target.value) : '')} />
        </div>
        <div className="col-12">
          <label className="form-label">Нотатки</label>
          <textarea className="form-control" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <div className="d-flex gap-2 mt-3">
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {initial ? 'Зберегти' : 'Додати'}
        </button>
        {initial && (
          <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
            Скасувати
          </button>
        )}
      </div>
    </form>
  );
}
