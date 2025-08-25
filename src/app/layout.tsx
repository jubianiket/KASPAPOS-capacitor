
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import { getSettings } from '@/lib/supabase';
import type { RestaurantSettings } from '@/types';
import { DataProvider } from '@/hooks/use-data';

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

  const applySettings = (settingsToApply: RestaurantSettings | null) => {
    if (settingsToApply) {
        setSettings(settingsToApply);
        document.documentElement.classList.toggle('dark', !!settingsToApply.dark_mode);
        if (settingsToApply.theme_color) {
            document.documentElement.style.setProperty('--primary', settingsToApply.theme_color);
        }
         if (settingsToApply.restaurant_name) {
            document.title = `${settingsToApply.restaurant_name} | KASPA POS`;
        }
      }
  }
  
  useEffect(() => {
    const initializeApp = async () => {
        // First, try to load settings from local storage for a fast initial load
        const cachedSettings = localStorage.getItem('restaurant_settings');
        if (cachedSettings) {
            applySettings(JSON.parse(cachedSettings));
        }

        // Then, fetch the latest settings from the database
        const fetchedSettings = await getSettings();
        applySettings(fetchedSettings);
    };
    
    initializeApp();
  }, []);

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
        <DataProvider>
          <div className="flex flex-col min-h-screen">
            <Sidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
            <Header onMenuClick={() => setIsSidebarOpen(true)} />
            <main className="flex-grow">
              {children}
            </main>
          </div>
          <Toaster />
        </DataProvider>
      </body>
    </html>
  );
}
