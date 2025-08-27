
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
    // This effect listens for changes in the user stored in localStorage
    // which typically happens on login/logout or when the page loads.
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
  }, [pathname]); // Re-check user on route change

  const fetchMenu = useCallback(async () => {
    if (!user?.restaurant_id) {
        // If there is no user or no restaurant_id, clear the menu and stop loading.
        setMenuItems([]);
        setIsMenuLoading(false);
        return;
    }
    
    // Set loading state to true before fetching.
    setIsMenuLoading(true);
    try {
        // Fetch menu items specifically for the user's restaurant.
        const items = await getMenuItems(user.restaurant_id);
        setMenuItems(items);
    } catch (error) {
        console.error("Failed to fetch menu items:", error);
        setMenuItems([]); // Set to empty array on error to avoid showing stale data.
    } finally {
        setIsMenuLoading(false);
    }
  }, [user]); // This hook depends on the user object.

  useEffect(() => {
    // This effect triggers the fetchMenu function whenever the user object changes.
    // This is the core logic that ensures the correct menu is loaded for the current user.
    fetchMenu();
  }, [fetchMenu]);

  const value = {
    menuItems,
    isMenuLoading,
    onRefreshMenu: fetchMenu, // Expose a manual refresh function
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
