
"use client";

import React, { useMemo } from 'react';
import { MinusCircle, PlusCircle, Sparkles, Trash2, X, Bike, Utensils } from 'lucide-react';
import type { OrderItem, MenuItem, Order } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import PaymentDialog from './payment-dialog';
import UpsellSuggestionsDrawer from './upsell-suggestions-drawer';
import { Badge } from './ui/badge';

const TAX_RATE = 0.1; // 10%

interface BillProps {
  order: Order | null;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearOrder: () => void;
  onConfirmOrder: (order: Order) => void;
  onCompleteOrder: (order: Order) => void;
  onAddToOrder: (item: MenuItem) => void;
}

export default function Bill({
  order,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onConfirmOrder,
  onCompleteOrder,
  onAddToOrder,
}: BillProps) {
  
  const orderItems = order?.items ?? [];

  const calculations = useMemo(() => {
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax - (order?.discount ?? 0);
    return { subtotal, tax, total };
  }, [orderItems, order?.discount]);

  const { subtotal, tax, total } = calculations;

  const handleConfirmOrder = () => {
    if(order) {
        const orderToConfirm: Order = {
            ...order,
            subtotal,
            tax,
            total,
        };
        onConfirmOrder(orderToConfirm);
    }
  }

  const handleCompleteOrder = (paymentMethod: NonNullable<Order['payment_method']>) => {
    if (order) {
      const orderToComplete: Order = {
        ...order,
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
      };
      onCompleteOrder(orderToComplete);
    }
  };

  const getOrderTitle = () => {
    if (!order) return 'No Order Selected';
    if (order.order_type === 'Delivery') return 'Delivery Order';
    if (order.table_number) return `Order for Table ${order.table_number}`;
    return 'Select a Table';
  }

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>{getOrderTitle()}</CardTitle>
            {orderItems.length > 0 && (
            <Button variant="ghost" size="icon" onClick={onClearOrder} className="text-muted-foreground hover:text-destructive">
                <Trash2 className="h-5 w-5" />
                <span className="sr-only">Clear Order</span>
            </Button>
            )}
        </div>
        {order && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {order.order_type === 'Dine In' ? <Utensils className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                <span>{order.order_type}</span>
                {order.order_type === 'Dine In' && order.table_number && (
                    <>
                    <Separator orientation="vertical" className="h-4"/>
                    <span>Table: <span className="font-semibold text-foreground">{order.table_number}</span></span>
                    </>
                )}
                 {order.status === 'confirmed' && <Badge variant="secondary">Confirmed</Badge>}
                 {order.status === 'pending' && <Badge variant="outline">Pending</Badge>}
            </div>
        )}
      </CardHeader>
      <CardContent>
        {orderItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p>{order ? 'This order is empty.' : 'Select a table or delivery to start.'}</p>
            <p className="text-sm">Click on menu items to add them.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                        <MinusCircle className="w-4 h-4" />
                      </Button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                        <PlusCircle className="w-4 h-4" />
                      </Button>
                        <p className="text-sm text-muted-foreground w-12 text-right">${(item.price * item.quantity).toFixed(2)}</p>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => onRemoveItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <Separator className="my-4" />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax ({(TAX_RATE * 100).toFixed(0)}%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              {(order?.discount ?? 0) > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>-${(order?.discount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {orderItems.length > 0 && (
        <CardFooter className="flex flex-col gap-2">
           <UpsellSuggestionsDrawer orderItems={orderItems} onAddToOrder={onAddToOrder}>
            <Button variant="outline" className="w-full bg-accent/20 hover:bg-accent/40 border-accent text-accent-foreground">
              <Sparkles className="mr-2 h-4 w-4" /> AI Upsell Suggestions
            </Button>
           </UpsellSuggestionsDrawer>
           {order?.status === 'pending' && (
              <Button onClick={handleConfirmOrder} className="w-full">
                Confirm Order
              </Button>
            )}
          <PaymentDialog total={total} onCompleteOrder={handleCompleteOrder} disabled={order?.status !== 'confirmed'}>
             <Button className="w-full text-lg py-6" disabled={order?.status !== 'confirmed'}>
              Proceed to Payment
            </Button>
          </PaymentDialog>
        </CardFooter>
      )}
    </Card>
  );
}
