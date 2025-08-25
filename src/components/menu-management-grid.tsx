
"use client";

import { useState } from 'react';
import type { MenuItem, GroupedMenuItem } from '@/types';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MenuManagementCard from './menu-management-card';

interface MenuManagementGridProps {
  groupedItems: GroupedMenuItem[];
  isLoading: boolean;
  selectedCategory: string;
  onEditItem: (item: MenuItem) => void;
  onDeleteItem: (itemId: number) => void;
}

const ITEMS_PER_PAGE = 8;

const PaginationControls = ({ currentPage, totalPages, onPrev, onNext }: { currentPage: number, totalPages: number, onPrev: () => void, onNext: () => void }) => {
    return (
        <div className="flex justify-center items-center gap-4 mt-6">
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

export default function MenuManagementGrid({ groupedItems, isLoading, selectedCategory, onEditItem, onDeleteItem }: MenuManagementGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteCandidateId, setDeleteCandidateId] = useState<number | null>(null);

  const filteredItems = selectedCategory === 'All'
    ? groupedItems
    : groupedItems.filter(item => item.category === selectedCategory);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  const handlePrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

  const handleDeleteRequest = (itemId: number) => {
    setDeleteCandidateId(itemId);
  };
  
  const confirmDelete = () => {
    if (deleteCandidateId) {
        onDeleteItem(deleteCandidateId);
    }
    setDeleteCandidateId(null);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-60 w-full" />)}
      </div>
    );
  }

  return (
    <>
      <AlertDialog open={!!deleteCandidateId} onOpenChange={() => setDeleteCandidateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the menu item portion.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {filteredItems.length === 0 ? (
        <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
          <p>No menu items found in this category.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedItems.map((item) => (
              <MenuManagementCard
                key={item.name}
                item={item}
                onEdit={onEditItem}
                onDelete={handleDeleteRequest}
              />
            ))}
          </div>
          {totalPages > 1 && (
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              onPrev={handlePrevPage}
              onNext={handleNextPage}
            />
          )}
        </>
      )}
    </>
  );
}
