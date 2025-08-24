
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { MenuItem } from '@/types';
import MenuItemCard from './menu-item-card';
import { getMenuItems, updateMenuItem } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';

interface MenuGridProps {
  onAddToOrder: (item: MenuItem) => void;
  onCategoriesLoad: (categories: string[]) => void;
  selectedCategory: string;
}

export default function MenuGrid({ onAddToOrder, onCategoriesLoad, selectedCategory }: MenuGridProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchMenuItems = useCallback(async () => {
    setIsLoading(true);
    const items = await getMenuItems();
    setMenuItems(items);
    
    const uniqueCategories = ['All', ...Array.from(new Set(items.map(item => item.category).filter(Boolean) as string[]))];
    onCategoriesLoad(uniqueCategories);

    setIsLoading(false);
  }, [onCategoriesLoad]);

  useEffect(() => {
    fetchMenuItems();
  }, [fetchMenuItems]);

  const handleUpdateItem = async (updatedItem: MenuItem) => {
    const originalRate = menuItems.find(item => item.id === updatedItem.id)?.rate;

    // Optimistic update
    setMenuItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? updatedItem : item));

    const result = await updateMenuItem(updatedItem.id, { rate: updatedItem.rate });
    if (!result) {
      toast({
        variant: 'destructive',
        title: 'Error updating price',
        description: 'Could not save the new price. Please try again.',
      });
      // Revert on failure
      setMenuItems(prevItems => prevItems.map(item => item.id === updatedItem.id ? { ...item, rate: originalRate! } : item));
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
        {filteredMenuItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <p>No menu items found for this category.</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredMenuItems.map((item) => (
                    <MenuItemCard 
                      key={item.id} 
                      item={item} 
                      onAddToOrder={onAddToOrder} 
                      onUpdateItem={handleUpdateItem}
                    />
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
