
"use client";

import { useEffect, useState } from 'react';
import type { Order } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Ticket, Calendar, Clock, Utensils, Bike, ChevronDown } from 'lucide-react';
import { Separator } from './ui/separator';
import { getCompletedOrders } from '@/lib/supabase';
import { Skeleton } from './ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

function OrderHistoryCard({ order }: { order: Order }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">Order #{order.id}</CardTitle>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                <span>{new Date(order.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{new Date(order.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
             <p className="font-bold text-lg text-primary">Rs.{order.total.toFixed(2)}</p>
             <Badge variant={order.payment_method === 'Card' ? 'default' : 'secondary'} className="capitalize mt-1">{order.payment_method}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
         <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
            {order.order_type === 'dine-in' ? <Utensils className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
            <span className="capitalize">{order.order_type}</span>
            {order.order_type === 'dine-in' && order.table_number && (
                <>
                <Separator orientation="vertical" className="h-4"/>
                <span>Table: <span className="font-semibold text-foreground">{order.table_number}</span></span>
                </>
            )}
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleContent>
             <div className="py-4 bg-muted/50 rounded-md px-4 mt-2">
              <h4 className="font-semibold mb-2">Order Details</h4>
              <ul className="space-y-1 text-sm">
                {order.items.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="flex justify-between">
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
                 <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>Rs.{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </CollapsibleContent>
          <CardFooter className="px-0 pb-0 pt-4">
            <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-center gap-2 text-sm">
                    {isOpen ? 'Hide' : 'View'} Details
                    <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </Button>
            </CollapsibleTrigger>
          </CardFooter>
        </Collapsible>

      </CardContent>
    </Card>
  )
}

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                   <Skeleton key={i} className="h-56 w-full" />
              ))}
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {orders.map((order) => (
        <OrderHistoryCard key={order.id} order={order} />
      ))}
    </div>
  );
}
