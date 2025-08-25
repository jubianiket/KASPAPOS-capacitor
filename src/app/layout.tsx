
'use client';

import React, { useEffect, useState } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import type { Restaurant } from '@/types';
import { getSettings } from '@/lib/supabase';
import { DataProvider } from '@/hooks/use-data';
import { usePathname } from 'next/navigation';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [settings, setSettings] = useState<Restaurant | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const applySettings = (settingsToApply: Restaurant | null) => {
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
    
    const initializeSettings = async () => {
        const userStr = localStorage.getItem('user');
        if (!userStr) return;
        const user = JSON.parse(userStr);

        if (user?.restaurant_id) {
            const fetchedSettings = await getSettings(user.restaurant_id);
            applySettings(fetchedSettings);
        }
    };
    
    // Re-initialize settings when path changes, e.g. after login
    initializeSettings();
  }, [pathname]);

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
