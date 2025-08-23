"use client";

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
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
  orderItems: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearOrder: () => void;
  onCompleteOrder: (completedOrder: Omit<Order, 'id' | 'timestamp' | 'orderType' | 'tableNumber'>) => void;
  onAddToOrder: (item: MenuItem) => void;
  orderType: 'Dine In' | 'Delivery';
  tableNumber?: string;
}

export default function Bill({
  orderItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onCompleteOrder,
  onAddToOrder,
  orderType,
  tableNumber,
}: BillProps) {
  const [discount, setDiscount] = useState(0); // For future implementation

  const calculations = useMemo(() => {
    const subtotal = orderItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax - discount;
    return { subtotal, tax, total };
  }, [orderItems, discount]);

  const { subtotal, tax, total } = calculations;

  const handleCompleteOrder = (paymentMethod: Order['paymentMethod']) => {
    onCompleteOrder({
      items: orderItems,
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
    });
  };

  return (
    <Card className="sticky top-24">
      <CardHeader>
        <div className="flex items-center justify-between">
            <CardTitle>Current Order</CardTitle>
            {orderItems.length > 0 && (
            <Button variant="ghost" size="icon" onClick={onClearOrder} className="text-muted-foreground hover:text-destructive">
                <X className="h-5 w-5" />
                <span className="sr-only">Clear Order</span>
            </Button>
            )}
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {orderType === 'Dine In' ? <Utensils className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
            <span>{orderType}</span>
            {orderType === 'Dine In' && tableNumber && (
                <>
                <Separator orientation="vertical" className="h-4"/>
                <span>Table: <span className="font-semibold text-foreground">{tableNumber}</span></span>
                </>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {orderItems.length === 0 ? (
          <div className="text-center text-muted-foreground py-16">
            <p>Your order is empty.</p>
            <p className="text-sm">Click on menu items to add them.</p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-64 pr-4">
              <div className="space-y-4">
                {orderItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-4">
                    <Image
                      src={item.imageUrl}
                      alt={item.name}
                      width={48}
                      height={48}
                      className="rounded-md object-cover"
                      data-ai-hint={`${item.category.toLowerCase()} ${item.name.split(' ')[1]?.toLowerCase() || ''}`}
                    />
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                        <MinusCircle className="w-4 h-4" />
                      </Button>
                      <span className="font-bold w-4 text-center">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                        <PlusCircle className="w-4 h-4" />
                      </Button>
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
              {discount > 0 && (
                <div className="flex justify-between text-destructive">
                  <span>Discount</span>
                  <span>-${discount.toFixed(2)}</span>
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
          <PaymentDialog total={total} onCompleteOrder={handleCompleteOrder}>
            <Button className="w-full text-lg py-6" disabled={orderType === 'Dine In' && !tableNumber}>
              Proceed to Payment
            </Button>
          </PaymentDialog>
        </CardFooter>
      )}
    </Card>
  );
}
