
"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { MenuItem, GroupedMenuItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { addMenuItem, updateMenuItem, deleteMenuItem } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import MenuManagementGrid from '@/components/menu-management-grid';
import MenuItemFormDialog from '@/components/menu-item-form-dialog';
import { useData } from '@/hooks/use-data';

export default function MenuPage() {
  const { menuItems, isMenuLoading, onRefreshMenu } = useData();
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.replace('/login');
    } else {
      setUser(JSON.parse(storedUser));
      setIsClient(true);
    }
  }, [router]);
  
  useEffect(() => {
    if (menuItems && menuItems.length > 0) {
        const uniqueCategories = ['All', ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean) as string[]))];
        setCategories(uniqueCategories);
    }
  }, [menuItems]);
  
  const groupedMenuItems = useMemo<GroupedMenuItem[]>(() => {
    if (!menuItems) return [];
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
    return Array.from(itemMap.values());
  }, [menuItems]);

  const handleCategoryChange = (value: string) => {
    if (value) {
      setSelectedCategory(value);
    }
  };

  const handleAddNewItem = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };
  
  const handleEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  }
  
  const handleDeleteItem = async (itemId: number) => {
      const success = await deleteMenuItem(itemId);
      if(success) {
          toast({ title: "Success", description: "Menu item deleted successfully."});
          onRefreshMenu();
      } else {
          toast({ variant: 'destructive', title: "Error", description: "Failed to delete menu item."});
      }
  }

  const handleFormSubmit = async (values: Partial<MenuItem>) => {
    const isEditing = !!editingItem;
    const action = isEditing ? updateMenuItem : addMenuItem;
    const result = isEditing ? await action(editingItem.id, values) : await action(values);

    if (result) {
        toast({ title: "Success", description: `Menu item ${isEditing ? 'updated' : 'added'} successfully.` });
        onRefreshMenu();
        setIsFormOpen(false);
        setEditingItem(null);
    } else {
        toast({ variant: 'destructive', title: "Error", description: `Failed to ${isEditing ? 'update' : 'add'} menu item.` });
    }
  };
  
  if (!isClient || !user) {
    return (
        <div className="flex justify-center items-center h-screen">
             <div className="text-center">
                <p>Loading...</p>
             </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <MenuItemFormDialog 
        isOpen={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        item={editingItem}
      />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Menu Management</h1>
        <Button onClick={handleAddNewItem}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>

       <div className="mb-6">
         <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Menu Categories</h3>
        </div>
        <ToggleGroup 
            type="single" 
            value={selectedCategory} 
            onValueChange={handleCategoryChange}
            className="flex-wrap justify-start"
        >
        {isMenuLoading ? (
            <Skeleton className="h-9 w-full" />
        ) : (
            categories.map(category => (
                <ToggleGroupItem key={category} value={category}>
                    {category}
                </ToggleGroupItem>
            ))
        )}
        </ToggleGroup>
      </div>

      <MenuManagementGrid
        groupedItems={groupedMenuItems}
        isLoading={isMenuLoading}
        selectedCategory={selectedCategory}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
      />
    </div>
  );
}
