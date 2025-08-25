
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

const KaspaLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="h-6 w-6"
  >
    <path
      d="M12 10.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5-1.5-.67-1.5-1.5.67-1.5 1.5-1.5z"
      opacity=".3"
    />
    <path
      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm3.04 4.04l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zM7.96 6.46l1.42-1.42 2.12 2.12-1.42 1.42L7.96 6.46zM12 7.5c2.49 0 4.5 2.01 4.5 4.5s-2.01 4.5-4.5 4.5S7.5 14.49 7.5 12 9.51 7.5 12 7.5zm4.04 8.04l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zm-8.08 0l1.42 1.42-2.12 2.12-1.42-1.42 2.12-2.12zM4 12c0-1.1.9-2 2-2h.5l-1.04 1.04 1.42 1.42L8.92 10.5H10.5v1.5H8.92l-2.04 2.04-1.42-1.42L6.5 14H6c-1.1 0-2-.9-2-2zm14.5 0c0 .83-.67 1.5-1.5 1.5h-1.58l-1.04-1.04-1.42 1.42 2.04 2.04H13.5v-1.5h1.58l2.04-2.04 1.42 1.42L17.5 14H18c.83 0 1.5-.67 1.5-1.5z"
    />
  </svg>
);


interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();
  
  if (pathname === '/login' || pathname === '/signup') {
      return null; // Don't render header on auth pages
  }

  return (
    <header className="bg-card border-b sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <KaspaLogo />
          <span>KASPA POS</span>
        </Link>
        <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-4 md:gap-6">
                {/* Desktop nav can remain here if needed, or be moved entirely to sidebar */}
            </nav>
            <Button variant="ghost" size="icon" onClick={onMenuClick}>
                <Menu className="h-6 w-6" />
                <span className="sr-only">Open Menu</span>
            </Button>
        </div>
      </div>
    </header>
  );
}
