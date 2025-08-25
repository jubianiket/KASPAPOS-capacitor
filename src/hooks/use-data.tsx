
"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import type { MenuItem, User } from '@/types';
import { getMenuItems } from '@/lib/supabase';
import { usePathname } from 'next/navigation';

interface DataContextProps {
  menuItems: MenuItem[];
  isMenuLoading: boolean;
  onRefreshMenu: () => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
  }, [pathname]);

  const fetchMenu = useCallback(async () => {
    if (!user?.restaurant_id) {
        setMenuItems([]);
        setIsMenuLoading(false);
        return;
    }
    setIsMenuLoading(true);
    try {
        const items = await getMenuItems(user.restaurant_id);
        setMenuItems(items);
    } catch (error) {
        console.error("Failed to fetch menu items:", error);
        setMenuItems([]); // Set to empty array on error
    } finally {
        setIsMenuLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

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
