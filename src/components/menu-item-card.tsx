
"use client";

import { useState } from 'react';
import { Plus, Edit, Check, Leaf, Drumstick } from 'lucide-react';
import type { MenuItem, GroupedMenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from './ui/input';
import { useToast } from '@/hooks/use-toast';

interface MenuItemCardProps {
  item: GroupedMenuItem;
  onAddToOrder: (item: GroupedMenuItem) => void;
  // This prop is no longer needed here as updates are handled on the menu management page
  onUpdateItem?: (item: MenuItem) => void;
}

const DietaryIcon = ({ type }: { type: 'veg' | 'non-veg' | string | undefined | null }) => {
  if (type === 'veg') {
    return <Leaf className="h-4 w-4 text-green-600" />;
  }
  if (type === 'non-veg') {
    return <Drumstick className="h-4 w-4 text-red-600" />;
  }
  return null;
}


export default function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  // Editing logic is being removed from this component for simplification.
  // It should be handled exclusively in the menu management page.
  const [newRate, setNewRate] = useState(item.baseRate);
  const { toast } = useToast();

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // This logic will be removed or disabled
  };

  const handleSavePrice = () => {
    // This logic will be removed or disabled
  };
  
  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this might navigate to an edit page or open a more complex dialog
    toast({ title: "Info", description: "Price editing is available on the Menu Management page."});
  }

  const handleAddClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      console.log('Adding item to order:', item.name);
      onAddToOrder(item);
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-4 flex-grow">
        <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base font-semibold mb-1">{item.name}</CardTitle>
            <DietaryIcon type={item.dietary_type} />
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <p className="text-lg font-bold text-primary">Rs.{Number(item.baseRate).toFixed(2)}</p>
        </div>
        <Button 
            size="icon" 
            variant="outline" 
            aria-label={`Add ${item.name} to order`}
            onClick={handleAddClick}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
