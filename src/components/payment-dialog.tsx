
"use client";

import React, { useState } from 'react';
import { DollarSign, CreditCard, Smartphone, CheckCircle, Receipt } from 'lucide-react';
import type { Order, Restaurant } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { BillReceipt } from './bill-receipt';
import Image from 'next/image';

interface PaymentDialogProps {
  children: React.ReactNode;
  total: number;
  onCompleteOrder: (paymentMethod: NonNullable<Order['payment_method']>) => Promise<Order | null | undefined>;
  disabled?: boolean;
  order: Order | null;
  onNewOrder: () => void;
  settings: Restaurant | null;
}

export default function PaymentDialog({
  children,
  total,
  onCompleteOrder,
  disabled = false,
  order,
  onNewOrder,
  settings,
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<NonNullable<Order['payment_method']> | ''>('');
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'payment' | 'receipt'>('payment');
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handlePayment = async () => {
    if (paymentMethod) {
      setIsProcessing(true);
      const result = await onCompleteOrder(paymentMethod);
      setIsProcessing(false);
      if (result) {
        setCompletedOrder(result);
        setView('receipt');
      } else {
        // Error toast is handled in page.tsx
        setIsOpen(false);
      }
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (disabled || isProcessing) return;
    setIsOpen(open);
     if (!open && view === 'receipt') {
        // If we close the dialog from the receipt view, trigger a new order.
        onNewOrder();
    }
    // Reset state on close
    setTimeout(() => {
        setView('payment');
        setPaymentMethod('');
        setCompletedOrder(null);
    }, 200);
  }

  const handleDialogCloseAndNewOrder = () => {
    setIsOpen(false);
    onNewOrder();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild disabled={disabled}>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {view === 'payment' && (
            <>
                <DialogHeader>
                    <DialogTitle>Complete Payment</DialogTitle>
                    <DialogDescription>Select a payment method to finalize the order.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-6">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground">Total Amount Due</p>
                        <p className="text-4xl font-bold text-primary">Rs.{total.toFixed(2)}</p>
                    </div>

                    {settings?.qr_code_url && (
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-sm font-medium">Scan to Pay</p>
                        <div className="p-2 border rounded-md">
                           <Image src={settings.qr_code_url} alt="Payment QR Code" width={200} height={200} data-ai-hint="QR code" />
                        </div>
                      </div>
                    )}

                    <div className="flex justify-center">
                        <ToggleGroup 
                        type="single"
                        variant="outline"
                        value={paymentMethod}
                        onValueChange={(value: NonNullable<Order['payment_method']>) => {
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
                    <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                    <Button onClick={handlePayment} disabled={!paymentMethod || isProcessing}>
                        {isProcessing ? 'Processing...' : `Confirm Payment - Rs.${total.toFixed(2)}`}
                    </Button>
                </DialogFooter>
            </>
        )}
        {view === 'receipt' && completedOrder && (
             <>
                <DialogHeader>
                     <DialogTitle className="flex items-center gap-2">
                        <CheckCircle className="h-6 w-6 text-green-500" />
                        <span>Payment Successful</span>
                    </DialogTitle>
                    <DialogDescription>The order has been completed. You can print the bill or start a new order.</DialogDescription>
                </DialogHeader>
                 <div className="py-4" id="receipt-section">
                    <BillReceipt order={completedOrder} />
                 </div>
                <DialogFooter className="sm:justify-between gap-2">
                    <Button onClick={handleDialogCloseAndNewOrder} variant="secondary">
                        Start New Order
                    </Button>
                </DialogFooter>
             </>
        )}
      </DialogContent>
    </Dialog>
  );
}
