
"use client";

import { useEffect, useState } from 'react';
import type { MenuItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  const categories = [...new Set(menuItems.map((item) => item.category))];

  if (isLoading) {
    return (
        <div>
            <div className="flex space-x-1 rounded-lg bg-muted p-1 mb-4">
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
                <Skeleton className="h-8 flex-1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>
        </div>
    );
  }

  return (
    <Tabs defaultValue={categories[0]} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-4">
        {categories.map((category) => (
          <TabsTrigger key={category} value={category}>
            {category}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((category) => (
        <TabsContent key={category} value={category}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {menuItems
              .filter((item) => item.category === category)
              .map((item) => (
                <MenuItemCard key={item.id} item={item} onAddToOrder={onAddToOrder} />
              ))}
          </div>
        </TabsContent>
      ))}
    </Tabs>
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
