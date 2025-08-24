"use client";

import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { type OrderItem, type MenuItem } from '@/types';
import { getMenuItems } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';
import { Lightbulb, Plus } from 'lucide-react';

interface UpsellSuggestionsDrawerProps {
  children: React.ReactNode;
  orderItems: OrderItem[];
  onAddToOrder: (item: MenuItem) => void;
}

export default function UpsellSuggestionsDrawer({
  children,
  orderItems,
  onAddToOrder,
}: UpsellSuggestionsDrawerProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    // This functionality is disabled for capacitor compatibility
  };
  
  const handleAddToOrder = (itemName: string) => {
    const itemToAdd = menuItems.find(item => item.name === itemName);
    if(itemToAdd) {
        onAddToOrder(itemToAdd);
        toast({
            title: `Added ${itemName} to order.`,
        })
    }
  }

  return (
    <Sheet>
      <SheetTrigger asChild onClick={fetchSuggestions}>
        {children}
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>AI Upsell Suggestions</SheetTitle>
          <SheetDescription>
            This feature is temporarily disabled.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
             <div className="text-center text-muted-foreground py-16">
                <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4">AI suggestions are not available in this version.</p>
            </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
