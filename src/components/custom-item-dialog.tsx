
"use client";

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

interface CustomItemDialogProps {
  onAddItem: (name: string, rate: number) => void;
}

export default function CustomItemDialog({ onAddItem }: CustomItemDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [rate, setRate] = useState('');
  const { toast } = useToast();

  const handleAddItem = () => {
    const numericRate = parseFloat(rate);
    if (!name.trim() || isNaN(numericRate) || numericRate <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Input',
        description: 'Please enter a valid item name and a positive price.',
      });
      return;
    }
    onAddItem(name, numericRate);
    setName('');
    setRate('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Custom Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Custom Item</DialogTitle>
          <DialogDescription>
            Enter the details for the item that is not on the menu.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Item Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Special Request Pasta"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="item-rate">Price (Rate)</Label>
            <Input
              id="item-rate"
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              placeholder="e.g., 15.00"
              required
            />
          </div>
        </div>
        <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleAddItem}>Add to Order</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
