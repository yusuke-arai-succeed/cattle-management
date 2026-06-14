export type CattleStatus = 'active' | 'shipped';
export type Gender = 'male' | 'female';

export interface Pen {
  id: string;
  name: string;
  capacity: number;
}

export interface Barn {
  id: string;
  name: string;
  capacity: number;
  pens: Pen[];
}

export interface Cattle {
  id: string; // 耳標番号
  breed: string; // 品種
  gender: Gender;
  birthDate: string;
  arrivalDate: string;
  arrivalWeight: number;
  status: CattleStatus;
  barnId: string | null;
  penId: string | null;
  supplierId?: string;
  supplierName?: string;
  purchasePrice?: number;
  notes?: string;
}

export interface IntakeRecord {
  id: string;
  date: string;
  cattleId: string;
  barnId: string;
  penId: string;
}

export interface ShipmentRecord {
  id: string;
  date: string;
  cattleId: string;
  weight: number;
  salePrice: number;
  buyer: string;
  notes?: string;
}

export interface MovementRecord {
  id: string;
  date: string;
  cattleIds: string[];
  fromBarnId: string;
  fromPenId: string;
  toBarnId: string;
  toPenId: string;
  reason?: string;
}

export interface FeedRecord {
  id: string;
  date: string;
  barnId: string;
  feedType: string;
  totalAmount: number; // kg
  cattleCount: number;
  perCattleAmount: number; // kg (計算値)
  notes?: string;
}

export interface AppData {
  barns: Barn[];
  cattle: Cattle[];
  intakeRecords: IntakeRecord[];
  shipmentRecords: ShipmentRecord[];
  movementRecords: MovementRecord[];
  feedRecords: FeedRecord[];
}
