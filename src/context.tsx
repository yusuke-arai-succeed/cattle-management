import React, { createContext, useContext, useState, useCallback } from 'react';
import type { AppData } from './types';
import { loadData, saveData } from './store';

interface AppContextValue {
  data: AppData;
  setData: (data: AppData) => void;
  update: (updater: (prev: AppData) => AppData) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [data, setDataState] = useState<AppData>(() => loadData());

  const setData = useCallback((newData: AppData) => {
    setDataState(newData);
    saveData(newData);
  }, []);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setDataState(prev => {
      const next = updater(prev);
      saveData(next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{ data, setData, update }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
