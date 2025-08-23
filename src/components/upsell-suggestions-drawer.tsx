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
import { getUpsellSuggestions } from '@/app/actions';
import { type OrderItem, type MenuItem } from '@/types';
import { menuItems } from '@/lib/menu-data';
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
  const { toast } = useToast();

  const fetchSuggestions = async () => {
    setIsLoading(true);
    setSuggestions([]);
    
    const currentOrder = orderItems.map(item => ({name: item.name, quantity: item.quantity}));

    const result = await getUpsellSuggestions(currentOrder);
    
    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
    } else if (result.suggestions) {
      setSuggestions(result.suggestions);
    }
    setIsLoading(false);
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
            Based on the current order, here are some items customers might also enjoy.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
          {isLoading && (
            <>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
            </>
          )}
          {!isLoading && suggestions.length === 0 && (
             <div className="text-center text-muted-foreground py-16">
                <Lightbulb className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4">No suggestions available right now.</p>
                <p className="text-sm">Try with a different combination of items.</p>
            </div>
          )}
          {!isLoading && suggestions.length > 0 && (
            <ul className="space-y-3">
              {suggestions.map((suggestion) => (
                <li key={suggestion}>
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                        <span className="font-medium">{suggestion}</span>
                        <Button size="sm" variant="outline" onClick={() => handleAddToOrder(suggestion)}>
                           <Plus className="h-4 w-4 mr-1"/> Add
                        </Button>
                    </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
