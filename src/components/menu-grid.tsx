
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { MenuItem, GroupedMenuItem } from '@/types';
import MenuItemCard from './menu-item-card';
import { updateMenuItem } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import PortionSelectionDialog from './portion-selection-dialog';

interface MenuGridProps {
  menuItems: MenuItem[];
  isLoading: boolean;
  onAddToOrder: (item: MenuItem, portion: string) => void;
  selectedCategory: string;
}

const ITEMS_PER_PAGE = 8;

const PaginationControls = ({ currentPage, totalPages, onPrev, onNext }: { currentPage: number, totalPages: number, onPrev: () => void, onNext: () => void }) => {
    return (
        <div className="flex justify-center items-center gap-4">
            <Button onClick={onPrev} disabled={currentPage === 1} variant="outline">
                <ChevronLeft className="h-4 w-4 mr-2"/>
                Previous
            </Button>
            <span className="text-sm font-medium">
                Page {currentPage} of {totalPages}
            </span>
            <Button onClick={onNext} disabled={currentPage === totalPages} variant="outline">
                Next
                <ChevronRight className="h-4 w-4 ml-2"/>
            </Button>
        </div>
    )
}

export default function MenuGrid({ menuItems, isLoading, onAddToOrder, selectedCategory }: MenuGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedItem, setSelectedItem] = useState<GroupedMenuItem | null>(null);
  const { toast } = useToast();
  
  const groupedMenuItems = useMemo<GroupedMenuItem[]>(() => {
    if (!menuItems) return [];
    const itemMap = new Map<string, GroupedMenuItem>();

    menuItems.forEach(item => {
      let group = itemMap.get(item.name);
      if (!group) {
        group = {
          name: item.name,
          category: item.category,
          baseRate: item.rate, // Use first item's rate as a base for display
          portions: [],
          dietary_type: item.dietary_type
        };
        itemMap.set(item.name, group);
      }
      group.portions.push(item);
    });

    return Array.from(itemMap.values());
  }, [menuItems]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when category changes
  }, [selectedCategory]);

  const handleSelectItemForPortion = (item: GroupedMenuItem) => {
    // If there's only one portion and it has a null/undefined/empty string or 'Regular' name, add it directly.
    if (item.portions.length === 1 && (!item.portions[0].portion || item.portions[0].portion === 'Regular')) {
        onAddToOrder(item.portions[0], item.portions[0].portion || 'Regular');
    } else {
        setSelectedItem(item);
    }
  }

  const handlePortionConfirm = (portionName: string) => {
    if (selectedItem) {
        const selectedPortionItem = selectedItem.portions.find(p => p.portion === portionName);
        if (selectedPortionItem) {
            onAddToOrder(selectedPortionItem, selectedPortionItem.portion || 'Regular');
        }
    }
    setSelectedItem(null);
  }

  const filteredMenuItems = selectedCategory === 'All'
    ? groupedMenuItems
    : groupedMenuItems.filter(item => item.category === selectedCategory);

  const totalPages = Math.ceil(filteredMenuItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredMenuItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  }

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
        {selectedItem && (
            <PortionSelectionDialog 
                isOpen={!!selectedItem}
                onOpenChange={(isOpen) => !isOpen && setSelectedItem(null)}
                itemName={selectedItem.name}
                portions={selectedItem.portions}
                onConfirm={handlePortionConfirm}
            />
        )}
        {filteredMenuItems.length === 0 ? (
            <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
                <p>No menu items found for this category.</p>
            </div>
        ) : (
          <>
            {totalPages > 1 && (
                <div className="mb-6">
                    <PaginationControls 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPrev={handlePrevPage} 
                        onNext={handleNextPage} 
                    />
                </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {paginatedItems.map((item) => (
                    <MenuItemCard 
                      key={item.name} 
                      item={item} 
                      onAddToOrder={() => handleSelectItemForPortion(item)} 
                    />
                ))}
            </div>
            {totalPages > 1 && (
              <div className="mt-6">
                  <PaginationControls 
                        currentPage={currentPage} 
                        totalPages={totalPages} 
                        onPrev={handlePrevPage} 
                        onNext={handleNextPage} 
                    />
              </div>
            )}
           </>
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
