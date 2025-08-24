
"use client";

import { useState, useEffect, useMemo } from "react";
import { MenuItem, GroupedMenuItem } from "@/types";
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, PlusCircle, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
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
import { Skeleton } from "./ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import MenuItemFormDialog from "./menu-item-form-dialog";
import { Separator } from "./ui/separator";

export default function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();

  const loadItems = async () => {
    setIsLoading(true);
    const items = await getMenuItems();
    setMenuItems(items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadItems();
  }, []);
  
  const groupedMenuItems = useMemo<GroupedMenuItem[]>(() => {
    const itemMap = new Map<string, GroupedMenuItem>();
    menuItems.forEach(item => {
      let group = itemMap.get(item.name);
      if (!group) {
        group = {
          name: item.name,
          category: item.category,
          baseRate: item.rate, // Not really used here, but required by type
          portions: [],
        };
        itemMap.set(item.name, group);
      }
      group.portions.push(item);
    });
    return Array.from(itemMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [menuItems]);

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
      loadItems();
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
      loadItems();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not delete the item." });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
           <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => handleOpenForm()}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Item
        </Button>
      </div>
      
      {groupedMenuItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupedMenuItems.map(group => (
                <Card key={group.name} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{group.name}</CardTitle>
                        <CardDescription>{group.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <Separator />
                        {group.portions.sort((a,b) => (a.portion || "").localeCompare(b.portion || "")).map(item => (
                            <div key={item.id} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{item.portion || 'Regular'}</p>
                                    <p className="text-sm text-muted-foreground">Rs.{item.rate.toFixed(2)}</p>
                                    <div>
                                        <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                                            {item.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge variant={item.available ? "default" : "secondary"} className="ml-2 bg-green-200 text-green-800 text-xs">
                                            {item.available ? "Available" : "Unavailable"}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleOpenForm(item)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleOpenDeleteAlert(item)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => handleAddNewPortion(group)}>
                           <PlusCircle className="mr-2 h-4 w-4" /> Add Portion
                        </Button>
                    </CardFooter>
                </Card>
            ))}
        </div>
      ) : (
         <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
            <h3 className="mt-4 text-lg font-medium">No Menu Items Found</h3>
            <p className="mt-1 text-sm">Click "Add New Item" to get started.</p>
        </div>
      )}

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
