
"use client";

import { useState } from 'react';
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

interface PortionSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  itemName: string;
  onConfirm: (portion: string) => void;
}

// TODO: In the future, these could come from the menu item's data
const PORTION_OPTIONS = ["Regular", "Large", "Family Pack"];

export default function PortionSelectionDialog({
  isOpen,
  onOpenChange,
  itemName,
  onConfirm,
}: PortionSelectionDialogProps) {
  const [selectedPortion, setSelectedPortion] = useState<string>(PORTION_OPTIONS[0]);

  const handleConfirm = () => {
    if (selectedPortion) {
      onConfirm(selectedPortion);
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
                    if (value) setSelectedPortion(value);
                }}
                className="flex-wrap"
            >
                {PORTION_OPTIONS.map((portion) => (
                    <ToggleGroupItem key={portion} value={portion} className="gap-2">
                        <CookingPot className="h-4 w-4" />
                        {portion}
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
