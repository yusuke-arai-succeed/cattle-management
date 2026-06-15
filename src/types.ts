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
  id: string;                   // 個体識別番号（耳標番号）
  breed: string;                // 品種
  gender: Gender;
  birthDate: string;
  arrivalDate: string;
  arrivalWeight: number;
  status: CattleStatus;
  barnId: string | null;
  penId: string | null;
  supplierId?: string;
  supplierName?: string;
  entryNumber?: string;         // 入場番号（市場での整理番号）
  auctionPriceExcTax?: number;  // セリ価格（税抜）
  consumptionTax?: number;      // 消費税額
  purchasePrice?: number;       // 購買金額（税込）
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

export type TreatmentCategory = '投薬' | '注射' | 'ワクチン' | '手術' | '診察' | 'その他';

export interface TreatmentRecord {
  id: string;
  date: string;
  cattleId: string;
  category: TreatmentCategory;
  description: string;   // 処置内容
  drug?: string;          // 使用薬品
  dosage?: string;        // 用量・投与量
  veterinarian?: string;  // 担当獣医・実施者
  cost: number;           // 費用（円）
  notes?: string;
}

export interface AppData {
  barns: Barn[];
  cattle: Cattle[];
  intakeRecords: IntakeRecord[];
  shipmentRecords: ShipmentRecord[];
  movementRecords: MovementRecord[];
  feedRecords: FeedRecord[];
  treatmentRecords: TreatmentRecord[];
}
