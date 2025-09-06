
"use client";

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CookingPot } from 'lucide-react';
import type { MenuItem } from '@/types';

interface PortionSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemName: string;
  portions: MenuItem[];
  onConfirm: (portion: string) => void;
}

export default function PortionSelectionDialog({
  isOpen,
  onOpenChange,
  itemName,
  portions,
  onConfirm,
}: PortionSelectionDialogProps) {
  const [selectedPortion, setSelectedPortion] = useState<string>('');

  useEffect(() => {
    // Set default selection when dialog opens
    console.log('[PortionSelectionDialog] Dialog open state changed:', { 
      isOpen, 
      portionsAvailable: portions.length,
      portions: portions.map(p => ({ id: p.id, portion: p.portion, rate: p.rate }))
    });
    if (isOpen && portions.length > 0) {
      const defaultPortion = portions[0].portion || 'Regular';
      console.log('[PortionSelectionDialog] Setting default portion:', defaultPortion);
      setSelectedPortion(defaultPortion);
    }
  }, [isOpen, portions]);

  const handleConfirm = () => {
    console.log('[PortionSelectionDialog] Confirming portion selection:', {
      itemName,
      selectedPortion,
      availablePortions: portions.map(p => p.portion)
    });
    if (selectedPortion) {
      console.log('[PortionSelectionDialog] Calling onConfirm with portion:', selectedPortion);
      onConfirm(selectedPortion);
    } else {
      console.warn('[PortionSelectionDialog] No portion selected');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Select Portion for {itemName}</DialogTitle>
          <DialogDescription>
            Choose a portion size to add to the order.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex justify-center">
            <ToggleGroup
                type="single"
                variant="outline"
                value={selectedPortion}
                onValueChange={(value) => {
                    console.log('[PortionSelectionDialog] Portion selection changed:', { value });
                    if (value) setSelectedPortion(value);
                }}
                className="flex-wrap justify-center"
            >
                {portions.map((portionItem) => (
                    <ToggleGroupItem key={portionItem.id} value={portionItem.portion || 'Regular'} className="gap-2">
                        <CookingPot className="h-4 w-4" />
                        <div>
                            <span>{portionItem.portion}</span>
                            <span className="text-xs text-muted-foreground ml-2">Rs.{portionItem.rate.toFixed(2)}</span>
                        </div>
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!selectedPortion}>Add to Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    