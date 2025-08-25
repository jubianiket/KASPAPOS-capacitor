
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Ticket, UtensilsCrossed, LayoutDashboard, LogOut, Settings, X, UserCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { Separator } from './ui/separator';

interface SidebarProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

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

export default function Sidebar({ isOpen, onOpenChange }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    onOpenChange(false);
    router.push('/login');
  };

  const closeSidebar = () => onOpenChange(false);

  const navLinks = [
    { href: '/', label: 'POS', icon: UtensilsCrossed },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/history', label: 'Order History', icon: Ticket },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-full max-w-xs p-0">
        <SheetHeader className="flex flex-row items-center justify-between p-4 border-b">
           <SheetTitle className="flex items-center gap-2 text-lg text-primary font-bold">
             <KaspaLogo />
             <span>KASPA POS</span>
           </SheetTitle>
           <SheetClose>
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
           </SheetClose>
        </SheetHeader>
        <div className="p-4">
             {user && (
                <div className="flex items-center gap-3 mb-4">
                    <UserCircle className="h-10 w-10 text-muted-foreground" />
                    <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                </div>
             )}
            <Separator />
        </div>
        <nav className="flex flex-col gap-2 p-4 pt-0">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              variant={pathname === href ? 'secondary' : 'ghost'}
              className="justify-start gap-3"
              asChild
              onClick={closeSidebar}
            >
              <Link href={href}>
                <Icon className="h-5 w-5" />
                <span>{label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
            <Button variant="outline" className="w-full justify-start gap-3" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
                <span>Log Out</span>
            </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
