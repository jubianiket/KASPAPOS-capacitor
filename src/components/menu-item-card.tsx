
"use client";

import { useState } from 'react';
import { Plus, Edit, Check } from 'lucide-react';
import type { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
  onUpdateItem: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToOrder, onUpdateItem }: MenuItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [newRate, setNewRate] = useState(item.rate);
  const { toast } = useToast();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string for work-in-progress input, but treat as 0 for numeric conversion
    if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0)) {
       setNewRate(Number(value));
    }
  };

  const handleSavePrice = () => {
    if (newRate !== item.rate) {
      onUpdateItem({ ...item, rate: newRate });
      toast({
        title: 'Price Updated',
        description: `${item.name} price has been updated to Rs.${newRate.toFixed(2)}`,
      })
    }
    setIsEditing(false);
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }

  const handleCardClick = (e: React.MouseEvent) => {
      e.preventDefault();
      onAddToOrder(item);
  }

  return (
    <Card 
        className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
        onClick={handleCardClick}
    >
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold mb-1">{item.name}</CardTitle>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        {isEditing ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Input
                    type="number"
                    value={newRate}
                    onChange={handlePriceChange}
                    className="h-9 w-24"
                    step="0.01"
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSavePrice() }}
                />
                <Button size="icon" variant="ghost" onClick={handleSavePrice}>
                    <Check className="h-5 w-5" />
                </Button>
            </div>
        ) : (
            <div className="flex items-center gap-2">
                <p className="text-lg font-bold text-primary">Rs.{Number(item.rate).toFixed(2)}</p>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={handleEditClick}>
                    <Edit className="h-4 w-4" />
                </Button>
            </div>
        )}
        <Button size="icon" variant="outline" aria-label={`Add ${item.name} to order`}>
          <Plus className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
