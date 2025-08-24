
"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import type { OrderItem, MenuItem, Order, User, RestaurantSettings, GroupedMenuItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/supabase';
import MenuManagementGrid from '@/components/menu-management-grid';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import MenuItemFormDialog from '@/components/menu-item-form-dialog';
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

export default function MenuPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  const fetchInitialData = useCallback(async () => {
      setIsLoading(true);
      const items = await getMenuItems();
      setMenuItems(items);

      const uniqueCategories = ['All', ...Array.from(new Set(items.map(item => item.category).filter(Boolean) as string[]))];
      setCategories(uniqueCategories);

      setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const groupedMenuItems = useMemo<GroupedMenuItem[]>(() => {
    const itemMap = new Map<string, GroupedMenuItem>();
    menuItems.forEach(item => {
      let group = itemMap.get(item.name);
      if (!group) {
        group = {
          name: item.name,
          category: item.category,
          baseRate: item.rate, 
          portions: [],
        };
        itemMap.set(item.name, group);
      }
      group.portions.push(item);
    });
    return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems]);

  const handleCategoryChange = (value: string) => {
    if (value) {
      setSelectedCategory(value);
    }
  };

  const handleOpenForm = (item: MenuItem | null = null) => {
    setSelectedItem(item);
    setIsFormOpen(true);
  };
  
  const handleAddNewPortion = (existingItem: GroupedMenuItem) => {
    const newItemTemplate: Partial<MenuItem> = {
        name: existingItem.name,
        category: existingItem.category,
        rate: 0,
        portion: "",
        available: true,
        is_active: true,
    }
    setSelectedItem(newItemTemplate as MenuItem);
    setIsFormOpen(true);
  }

  const handleOpenDeleteAlert = (item: MenuItem) => {
    setSelectedItem(item);
    setIsDeleteAlertOpen(true);
  };

  const handleFormSubmit = async (values: Partial<MenuItem>) => {
    try {
      if (selectedItem && selectedItem.id) { // Editing existing item
        await updateMenuItem(selectedItem.id, values);
        toast({ title: "Success", description: "Menu item updated." });
      } else { // Adding new item or portion
        await addMenuItem(values);
        toast({ title: "Success", description: "New menu item added." });
      }
      setIsFormOpen(false);
      setSelectedItem(null);
      fetchInitialData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not save the item." });
    }
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    try {
      await deleteMenuItem(selectedItem.id);
      toast({ title: "Success", description: "Menu item deleted." });
      setIsDeleteAlertOpen(false);
      setSelectedItem(null);
      fetchInitialData();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the item." });
    }
  };


  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Item
        </Button>
      </div>
      
       <div className="mb-6">
          <h3 className="text-lg font-semibold">Menu Categories</h3>
          <ToggleGroup 
              type="single" 
              value={selectedCategory} 
              onValueChange={handleCategoryChange}
              className="flex-wrap justify-start mt-3"
          >
          {categories.map(category => (
              <ToggleGroupItem key={category} value={category}>
                  {category}
              </ToggleGroupItem>
          ))}
          </ToggleGroup>
      </div>

      <MenuManagementGrid
        groupedMenuItems={groupedMenuItems}
        isLoading={isLoading}
        selectedCategory={selectedCategory}
        onEditItem={handleOpenForm}
        onDeleteItem={handleOpenDeleteAlert}
        onAddNewPortion={handleAddNewPortion}
      />

       <MenuItemFormDialog
        isOpen={isFormOpen}
        onOpenChange={(open) => {
            if(!open) setSelectedItem(null);
            setIsFormOpen(open);
        }}
        onSubmit={handleFormSubmit}
        item={selectedItem}
      />

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the menu item
              "{selectedItem?.name} - {selectedItem?.portion}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
