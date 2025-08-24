
"use client";

import { useEffect, useState } from 'react';
import type { MenuItem } from '@/types';
import MenuItemCard from './menu-item-card';
import { getMenuItems } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';

interface MenuGridProps {
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuGrid({ onAddToOrder }: MenuGridProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      const items = await getMenuItems();
      setMenuItems(items);
      setIsLoading(false);
    };
    fetchMenuItems();
  }, []);

  if (isLoading) {
    return (
        <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
  }

    if (menuItems.length === 0) {
      return (
          <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
              <p>No menu items available.</p>
          </div>
      )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {menuItems.map((item) => (
        <MenuItemCard key={item.id} item={item} onAddToOrder={onAddToOrder} />
      ))}
    </div>
  );
}

const CardSkeleton = () => (
    <div className="flex flex-col space-y-3">
        <Skeleton className="h-[125px] w-full rounded-xl" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    </div>
)
