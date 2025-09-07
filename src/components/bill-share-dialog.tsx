
"use client";

import { useState } from 'react';
import type { Order, Restaurant } from '@/types';
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
import { BillReceipt } from './bill-receipt';
import { ScrollArea } from './ui/scroll-area';

interface BillShareDialogProps {
  children: React.ReactNode;
  order: Order | null;
  settings: Restaurant | null;
}

export default function BillShareDialog({
  children,
  order,
  settings,
}: BillShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!order) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Bill for Order #{order.id}</DialogTitle>
          <DialogDescription>
            You can share or print this bill for the customer.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] p-1">
          <BillReceipt order={order} settings={settings} />
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
