"use client";

import { useLocalStorage } from '@/hooks/use-local-storage';
import type { Order } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Ticket, Calendar, Clock } from 'lucide-react';

export default function OrderHistory() {
  const [orders] = useLocalStorage<Order[]>('orders', []);
  
  const sortedOrders = [...orders].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (sortedOrders.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-16 border-2 border-dashed rounded-lg">
        <Ticket className="mx-auto h-12 w-12" />
        <h3 className="mt-4 text-lg font-medium">No Order History Found</h3>
        <p className="mt-1 text-sm">Completed orders will appear here.</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="w-full">
      {sortedOrders.map((order) => (
        <AccordionItem key={order.id} value={order.id}>
          <AccordionTrigger>
            <div className="flex justify-between items-center w-full pr-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{new Date(order.timestamp).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">{new Date(order.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <Badge variant={order.paymentMethod === 'Card' ? 'default' : 'secondary'} className="capitalize">{order.paymentMethod}</Badge>
                 <span className="font-bold text-lg text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-muted/50 rounded-md">
              <h4 className="font-semibold mb-2">Order Details</h4>
              <ul className="space-y-1 text-sm">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.name} <span className="text-muted-foreground">x {item.quantity}</span>
                    </span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-2" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                   <div className="flex justify-between text-destructive">
                     <span className="text-muted-foreground">Discount</span>
                     <span>-${order.discount.toFixed(2)}</span>
                   </div>
                )}
                 <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
