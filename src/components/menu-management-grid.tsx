
"use client";

import { useState, useMemo, useEffect } from 'react';
import type { MenuItem, GroupedMenuItem } from '@/types';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MenuManagementCard from './menu-management-card';

interface MenuManagementGridProps {
  groupedMenuItems: GroupedMenuItem[];
  isLoading: boolean;
  selectedCategory: string;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (item: MenuItem) => void;
  onAddNewPortion: (group: GroupedMenuItem) => void;
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

export default function MenuManagementGrid({ 
    groupedMenuItems, 
    isLoading, 
    selectedCategory,
    onEditItem,
    onDeleteItem,
    onAddNewPortion,
}: MenuManagementGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when category changes
  }, [selectedCategory]);


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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {paginatedItems.map((group) => (
                    <MenuManagementCard 
                      key={group.name} 
                      group={group} 
                      onEditItem={onEditItem}
                      onDeleteItem={onDeleteItem}
                      onAddNewPortion={onAddNewPortion}
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
