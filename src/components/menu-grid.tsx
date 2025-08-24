
"use client";

import { useEffect, useState } from 'react';
import type { MenuItem } from '@/types';
import MenuItemCard from './menu-item-card';
import { getMenuItems } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';

interface MenuGridProps {
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuGrid({ onAddToOrder }: MenuGridProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    const fetchMenuItems = async () => {
      setIsLoading(true);
      const items = await getMenuItems();
      setMenuItems(items);
      
      const uniqueCategories = ['All', ...Array.from(new Set(items.map(item => item.category).filter(Boolean) as string[]))];
      setCategories(uniqueCategories);

      setIsLoading(false);
    };
    fetchMenuItems();
  }, []);

  const handleCategoryChange = (value: string) => {
    if (value) {
      setSelectedCategory(value);
    }
  };

  const filteredMenuItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter(item => item.category === selectedCategory);


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

  return (
    <div>
        <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Menu Categories</h3>
            <ToggleGroup 
                type="single" 
                value={selectedCategory} 
                onValueChange={handleCategoryChange}
                className="flex-wrap justify-start"
            >
            {categories.map(category => (
                <ToggleGroupItem key={category} value={category}>
                    {category}
                </ToggleGroupItem>
            ))}
            </ToggleGroup>
        </div>

        {filteredMenuItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <p>No menu items found for this category.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMenuItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToOrder={onAddToOrder} />
                ))}
            </div>
        )}
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
