
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Order } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface DeliveryDetailsDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  order: Order | null;
  onConfirm: (deliveryDetails: Partial<Order>) => void;
}

export default function DeliveryDetailsDialog({
  isOpen,
  onOpenChange,
  order,
  onConfirm,
}: DeliveryDetailsDialogProps) {
  const [details, setDetails] = useState({
    phone_no: order?.phone_no || '',
    flat_no: order?.flat_no || '',
    building_no: order?.building_no || '',
    address: order?.address || '',
  });
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDetails({ ...details, [e.target.id]: e.target.value });
  };

  const handleConfirm = () => {
    if (!details.phone_no || !details.flat_no) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Phone number and Flat / Apt Number are required.',
      });
      return;
    }
    onConfirm(details);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delivery Details</DialogTitle>
          <DialogDescription>
            Please enter the customer's delivery information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone_no">Phone Number</Label>
              <Input
                id="phone_no"
                value={details.phone_no}
                onChange={handleChange}
                placeholder="Customer's phone"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="flat_no">Flat / Apt Number</Label>
              <Input
                id="flat_no"
                value={details.flat_no}
                onChange={handleChange}
                placeholder="e.g., 4B"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
              <Label htmlFor="building_no">Building Name / Number (Optional)</Label>
              <Input
                id="building_no"
                value={details.building_no}
                onChange={handleChange}
                placeholder="e.g., Sunshine Apartments"
              />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Street Address (Optional)</Label>
            <Input
              id="address"
              value={details.address}
              onChange={handleChange}
              placeholder="e.g., 123 Main Street"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm Details</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
