
'use client';

import React, { useEffect, useState } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/header';
import Sidebar from '@/components/sidebar';
import { DataProvider, useData } from '@/hooks/use-data';
import { usePathname } from 'next/navigation';

function AppInitializer({ children }: { children: React.ReactNode }) {
  const { settings } = useData();

  useEffect(() => {
    if (settings) {
        document.documentElement.classList.toggle('dark', !!settings.dark_mode);
        if (settings.theme_color) {
            document.documentElement.style.setProperty('--primary', settings.theme_color);
        }
         if (settings.restaurant_name) {
            document.title = `${settings.restaurant_name} | KASPA POS`;
        }
      }
  }, [settings]);

  return <>{children}</>;
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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
          <AppInitializer>
            <div className="flex flex-col min-h-screen">
              <Sidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen} />
              <Header onMenuClick={() => setIsSidebarOpen(true)} />
              <main className="flex-grow">
                {children}
              </main>
            </div>
            <Toaster />
          </AppInitializer>
        </DataProvider>
      </body>
    </html>
  );
}
