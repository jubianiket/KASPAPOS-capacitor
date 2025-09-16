
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
  // This layout purposely does not use the main RootLayout to provide a clean
  // interface for the kitchen. We apply the background color to a div
  // that wraps the children to avoid hydration errors with the main body tag.
  return (
    <div className="font-body antialiased bg-muted/40 min-h-screen">
        <main>{children}</main>
        <Toaster />
    </div>
  );
}
