
'use client';

// This is a special layout for the KDS page to provide a clean, focused view
// without the main app's header and sidebar.

import React from 'react';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';

export default function KDSLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <body className="font-body antialiased bg-muted/40">
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
