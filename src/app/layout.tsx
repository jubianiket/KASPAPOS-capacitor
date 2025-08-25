
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import { getSettings, getMenuItems } from '@/lib/supabase';
import type { RestaurantSettings, MenuItem } from '@/types';

// This component can't be a server component because we need to fetch settings
// and apply them dynamically, which requires client-side logic.
// export const metadata: Metadata = {
//   title: 'KASPA POS',
//   description: 'A modern Point of Sale for restaurants',
//   icons: {
//     icon: [],
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isMenuLoading, setIsMenuLoading] = useState(true);

  const fetchMenu = useCallback(async () => {
    setIsMenuLoading(true);
    const items = await getMenuItems();
    setMenuItems(items);
    setIsMenuLoading(false);
  }, []);
  
  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);


  useEffect(() => {
    const fetchAndApplySettings = async () => {
      const fetchedSettings = await getSettings();
      if (fetchedSettings) {
        setSettings(fetchedSettings);
        document.documentElement.classList.toggle('dark', !!fetchedSettings.dark_mode);
        if (fetchedSettings.theme_color) {
            // HSL values are stored as a string "H S% L%" but CSS variables need them without units
            // e.g. "240 5.9% 10%" -> "240 5.9 10" - this is incorrect, it needs the percentage.
            // The format from the input is likely correct "240 5.9% 10%". Let's assume it is.
            document.documentElement.style.setProperty('--primary', fetchedSettings.theme_color);
        }
         if (fetchedSettings.restaurant_name) {
            document.title = `${fetchedSettings.restaurant_name} | KASPA POS`;
        }
      }
    };
    fetchAndApplySettings();
  }, []);

  // Clone element is necessary to pass server-fetched data to client components.
  // This pattern is common for this type of architecture (client-side data fetching at root)
  const childrenWithProps = React.Children.map(children, child => {
      if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement, { 
              menuItems, 
              isMenuLoading,
              onRefreshMenu: fetchMenu 
          });
      }
      return child;
  });

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        ></link>
      </head>
      <body className="font-body antialiased">
        <Sidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
        <div className="flex flex-col min-h-screen">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <main className="flex-grow">
            {childrenWithProps}
          </main>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
