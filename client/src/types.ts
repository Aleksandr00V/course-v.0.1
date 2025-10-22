// Vehicle statuses aligned to UI: base (На базі), trip (На виїзді), repair (В ремонті)
export type VehicleStatus = 'base' | 'trip' | 'repair';

export interface Vehicle {
  id: string;
  make: string; // марка
  model: string; // модель
  type: string; // тип (вантажівка, бронетехніка тощо)
  status: VehicleStatus;
  assignedUnit?: string; // підрозділ
  vin?: string;
  registrationNumber: string; // держномер
  year?: number;
  mileage?: number; // пробіг
  notes?: string;
}

export interface Driver {
  id: string;
  firstName: string;
  lastName: string;
  licenseNumber: string;
  rank?: string;
  phone?: string;
  notes?: string;
  photoUrl?: string; // uploaded image path
}

export interface Trip {
  id: string;
  driverId: string;
  vehicleId: string;
  date: string; // ISO
  distanceKm: number;
  notes?: string;
}
