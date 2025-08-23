"use client";

import React, { useState } from 'react';
import { DollarSign, CreditCard, Smartphone } from 'lucide-react';
import type { Order } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

interface PaymentDialogProps {
  children: React.ReactNode;
  total: number;
  onCompleteOrder: (paymentMethod: Order['paymentMethod']) => void;
}

export default function PaymentDialog({
  children,
  total,
  onCompleteOrder,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<Order['paymentMethod'] | ''>('');
  const [isOpen, setIsOpen] = useState(false);
  
  const handlePayment = () => {
    if (paymentMethod) {
      onCompleteOrder(paymentMethod);
      setIsOpen(false);
      setPaymentMethod('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>Select a payment method to finalize the order.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Amount Due</p>
            <p className="text-4xl font-bold text-primary">${total.toFixed(2)}</p>
          </div>
          <div className="flex justify-center">
            <ToggleGroup 
              type="single"
              variant="outline"
              value={paymentMethod}
              onValueChange={(value: Order['paymentMethod']) => {
                if(value) setPaymentMethod(value)
              }}
            >
              <ToggleGroupItem value="Cash" aria-label="Pay with cash">
                <DollarSign className="h-5 w-5 mr-2" />
                Cash
              </ToggleGroupItem>
              <ToggleGroupItem value="Card" aria-label="Pay with card">
                <CreditCard className="h-5 w-5 mr-2" />
                Card
              </ToggleGroupItem>
              <ToggleGroupItem value="Mobile" aria-label="Pay with mobile">
                <Smartphone className="h-5 w-5 mr-2" />
                Mobile
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={handlePayment} disabled={!paymentMethod}>
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
