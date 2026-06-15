import type { AppData } from './types';

const STORAGE_KEY = 'cattle_management_data';

const defaultData: AppData = {
  barns: [],
  cattle: [],
  intakeRecords: [],
  shipmentRecords: [],
  movementRecords: [],
  feedRecords: [],
  treatmentRecords: [],
};

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData;
    return { ...defaultData, ...JSON.parse(raw) };
  } catch {
    return defaultData;
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
