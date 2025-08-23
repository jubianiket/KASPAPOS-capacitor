"use client";

import { menuItems } from '@/lib/menu-data';
import type { MenuItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import MenuItemCard from './menu-item-card';

interface MenuGridProps {
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuGrid({ onAddToOrder }: MenuGridProps) {
  const categories = [...new Set(menuItems.map((item) => item.category))];

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
