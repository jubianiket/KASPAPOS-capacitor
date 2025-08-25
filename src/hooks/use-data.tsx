
"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import type { MenuItem } from '@/types';
import { getMenuItems } from '@/lib/supabase';

interface DataContextProps {
  menuItems: MenuItem[];
  isMenuLoading: boolean;
  onRefreshMenu: () => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    setIsMenuLoading(true);
    const items = await getMenuItems();
    setMenuItems(items);
    setIsMenuLoading(false);
  }, []);

  const value = {
    menuItems,
    isMenuLoading,
    onRefreshMenu: fetchMenu,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
