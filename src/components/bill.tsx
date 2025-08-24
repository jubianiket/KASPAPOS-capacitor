
"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { MinusCircle, PlusCircle, Trash2, X, Bike, Utensils, Send, CheckCheck } from 'lucide-react';
import type { OrderItem, MenuItem, Order, RestaurantSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import PaymentDialog from './payment-dialog';
import { Badge } from './ui/badge';
import { getSettings } from '@/lib/supabase';

interface BillProps {
  order: Order | null;
  onUpdateQuantity: (itemId: number, quantity: number) => void;
  onRemoveItem: (itemId: number) => void;
  onClearOrder: () => void;
  onCompleteOrder: (order: Order) => Promise<Order | null | undefined>;
  onConfirmOrder: () => void;
  onMarkAsCompleted: () => void;
  onAddToOrder: (item: MenuItem) => void;
}

export default function Bill({
  order,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder,
  onCompleteOrder,
  onConfirmOrder,
  onMarkAsCompleted
}: BillProps) {
  
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const orderItems = order?.items ?? [];
  
  useEffect(() => {
    const fetchSettings = async () => {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);
    };
    fetchSettings();
  }, []);

  const calculations = useMemo(() => {
    const subtotal = orderItems.reduce((acc, item) => acc + item.rate * item.quantity, 0);
    
    let tax = 0;
    const taxBreakdown: { name: string, amount: number }[] = [];

    if (settings && settings.tax_enabled && settings.tax_rate) {
        const taxAmount = subtotal * (settings.tax_rate / 100);
        tax += taxAmount;
        taxBreakdown.push({ name: `Tax (${settings.tax_rate}%)`, amount: taxAmount});
    }

    const total = subtotal + tax;
    return { subtotal, tax, total, taxBreakdown };
  }, [orderItems, settings]);

  const { subtotal, tax, total, taxBreakdown } = calculations;

  const handleCompleteOrder = async (paymentMethod: NonNullable<Order['payment_method']>) => {
    if (order) {
      const orderToComplete: Order = {
        ...order,
        subtotal,
        tax,
        total,
        payment_method: paymentMethod,
      };
      return await onCompleteOrder(orderToComplete);
    }
  };

  const getOrderTitle = () => {
    if (!order) return 'No Order Selected';
    if (order.order_type === 'delivery') return 'Delivery Order';
    if (order.table_number) return `Order for Table ${order.table_number}`;
    return 'Select a Table';
  }

  const isPaymentDisabled = () => {
    if (!order) return true;
    if (order.status !== 'completed') return true;
    return order.items.length === 0;
  }
  
  const isConfirmDisabled = () => {
      if (!order) return true;
      return order.items.length === 0;
  }

  const renderActionButtons = () => {
    if (!order || order.items.length === 0) return null;

    switch(order.status) {
        case 'pending':
            return (
                <Button className="w-full text-lg py-6" onClick={onConfirmOrder} disabled={isConfirmDisabled()}>
                    <Send className="mr-2 h-5 w-5" />
                    Confirm Order
                </Button>
            );
        case 'received':
            return (
                 <Button className="w-full text-lg py-6" onClick={onMarkAsCompleted} variant="secondary">
                    <CheckCheck className="mr-2 h-5 w-5" />
                    Mark as Completed
                </Button>
            );
        case 'completed':
            return (
                 <PaymentDialog 
                    order={order} 
                    total={total} 
                    onCompleteOrder={handleCompleteOrder} 
                    disabled={isPaymentDisabled()}
                >
                    <Button className="w-full text-lg py-6" disabled={isPaymentDisabled()}>
                    Proceed to Payment
                    </Button>
                </PaymentDialog>
            );
        default:
            return null;
    }
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
                {order.order_type === 'dine-in' ? <Utensils className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                <span className="capitalize">{order.order_type}</span>
                {order.order_type === 'dine-in' && order.table_number && (
                    <>
                    <Separator orientation="vertical" className="h-4"/>
                    <span>Table: <span className="font-semibold text-foreground">{order.table_number}</span></span>
                    </>
                )}
                 {order.status && <Badge variant={order.status === 'pending' ? 'outline' : 'secondary'} className="capitalize">{order.status}</Badge>}
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
                        <p className="text-sm text-muted-foreground w-12 text-right">Rs.{(item.rate * item.quantity).toFixed(2)}</p>
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
                <span>Rs.{subtotal.toFixed(2)}</span>
              </div>
              {taxBreakdown.map(t => (
                  <div key={t.name} className="flex justify-between">
                    <span>{t.name}</span>
                    <span>Rs.{t.amount.toFixed(2)}</span>
                  </div>
              ))}
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>Rs.{total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
      {orderItems.length > 0 && (
        <CardFooter className="flex flex-col gap-2">
           {renderActionButtons()}
        </CardFooter>
      )}
    </Card>
  );
}
