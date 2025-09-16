
"use client";

import React, { createContext, useContext, ReactNode, useState, useCallback, useEffect } from 'react';
import type { MenuItem, User, Restaurant, Order } from '@/types';
import { getMenuItems, getSettings, getActiveOrders, supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { usePathname } from 'next/navigation';

interface DataContextProps {
  menuItems: MenuItem[];
  isMenuLoading: boolean;
  settings: Restaurant | null;
  isSettingsLoading: boolean;
  activeOrders: Order[];
  isOrdersLoading: boolean;
  onRefreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextProps | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<Restaurant | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  
  const [isMenuLoading, setIsMenuLoading] = useState(true);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(true);
  
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
    } else {
      setUser(null);
    }
  }, [pathname]);

  const fetchAllData = useCallback(async () => {
    if (!user?.restaurant_id) {
        setMenuItems([]);
        setSettings(null);
        setActiveOrders([]);
        setIsMenuLoading(false);
        setIsSettingsLoading(false);
        setIsOrdersLoading(false);
        return;
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        console.error('[DataProvider] Supabase configuration is missing.');
        setIsMenuLoading(false);
        setIsSettingsLoading(false);
        setIsOrdersLoading(false);
        return;
    }
    
    setIsMenuLoading(true);
    setIsSettingsLoading(true);
    setIsOrdersLoading(true);

    try {
        const [items, fetchedSettings, orders] = await Promise.all([
            getMenuItems(user.restaurant_id),
            getSettings(user.restaurant_id),
            getActiveOrders(user.restaurant_id)
        ]);

        setMenuItems(items);
        setSettings(fetchedSettings);
        setActiveOrders(orders);

    } catch (error) {
        console.error("[DataProvider] Failed to fetch initial data:", error);
        setMenuItems([]);
        setSettings(null);
        setActiveOrders([]);
    } finally {
        setIsMenuLoading(false);
        setIsSettingsLoading(false);
        setIsOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAllData();

    if (!user?.restaurant_id) return;
    
    const ordersChannel = supabase.channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `restaurant_id=eq.${user.restaurant_id}` },
        (payload) => {
          console.log('[Supabase] Order change received:', payload);
          fetchAllData();
        }
      )
      .subscribe();
      
    const menuItemsChannel = supabase.channel('menu-items-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'menu_items', filter: `restaurant_id=eq.${user.restaurant_id}` },
            (payload) => {
                console.log('[Supabase] Menu item change received:', payload);
                fetchAllData();
            }
        ).subscribe();

    const settingsChannel = supabase.channel('settings-channel')
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'restaurants', filter: `id=eq.${user.restaurant_id}` },
            (payload) => {
                console.log('[Supabase] Settings change received:', payload);
                fetchAllData();
            }
        ).subscribe();


    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(menuItemsChannel);
      supabase.removeChannel(settingsChannel);
    };
    
  }, [fetchAllData, user?.restaurant_id]);

  const value = {
    menuItems,
    isMenuLoading,
    settings,
    isSettingsLoading,
    activeOrders,
    isOrdersLoading,
    onRefreshAll: fetchAllData,
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
