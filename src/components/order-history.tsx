
"use client";

import { useEffect, useState } from 'react';
import type { Order } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Ticket, Calendar, Clock, Utensils, Bike } from 'lucide-react';
import { Separator } from './ui/separator';
import { getCompletedOrders } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';

export default function OrderHistory() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      const completedOrders = await getCompletedOrders();
      setOrders(completedOrders);
      setIsLoading(false);
    };
    fetchOrders();
  }, []);

  if (isLoading) {
      return (
          <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
          </div>
      )
  }

  if (orders.length === 0) {
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
      {orders.map((order) => (
        <AccordionItem key={order.id} value={order.id.toString()}>
          <AccordionTrigger>
            <div className="flex justify-between items-center w-full pr-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-muted-foreground">{new Date(order.created_at).toLocaleTimeString()}</span>
                </div>
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {(order.order_type === 'Dine In' || order.order_type === 'dine-in') ? <Utensils className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                    <span className="capitalize">{order.order_type}</span>
                    {(order.order_type === 'Dine In' || order.order_type === 'dine-in') && order.table_number && (
                        <>
                        <Separator orientation="vertical" className="h-4"/>
                        <span>Table: <span className="font-semibold text-foreground">{order.table_number}</span></span>
                        </>
                    )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <Badge variant={order.payment_method === 'Card' ? 'default' : 'secondary'} className="capitalize">{order.payment_method}</Badge>
                 <span className="font-bold text-lg text-primary">Rs.{order.total.toFixed(2)}</span>
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
                    <span>Rs.{(item.rate * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-2" />
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rs.{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>Rs.{order.tax.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                   <div className="flex justify-between text-destructive">
                     <span className="text-muted-foreground">Discount</span>
                     <span>-Rs.{order.discount.toFixed(2)}</span>
                   </div>
                )}
                 <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>Rs.{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

    