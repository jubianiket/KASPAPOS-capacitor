
"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import type { MenuItem } from '@/types';

interface DataContextProps {
  menuItems: MenuItem[];
  isMenuLoading: boolean;
  onRefreshMenu: () => void;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children, value }: { children: ReactNode; value: DataContextProps }) {
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
