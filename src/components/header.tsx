"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sheet, Ticket, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'POS', icon: UtensilsCrossed },
    { href: '/history', label: 'Order History', icon: Ticket },
  ];

  return (
    <header className="bg-card border-b sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-primary">
          <Sheet className="h-6 w-6" />
          <span>BillEase POS</span>
        </Link>
        <nav className="flex items-center gap-4 md:gap-6">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === href ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
