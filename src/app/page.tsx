"use client";

import React, { useState } from 'react';
import Bill from '@/components/bill';
import MenuGrid from '@/components/menu-grid';
import type { OrderItem, MenuItem, Order } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Utensils, Bike } from 'lucide-react';

export default function Home() {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery'>('Dine In');
  const [tableNumber, setTableNumber] = useState<string>('');

  const addToOrder = (item: MenuItem) => {
    setOrder((prevOrder) => {
      const existingItem = prevOrder.find((orderItem) => orderItem.id === item.id);
      if (existingItem) {
        return prevOrder.map((orderItem) =>
          orderItem.id === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }
      return [...prevOrder, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromOrder(itemId);
    } else {
      setOrder((prevOrder) =>
        prevOrder.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromOrder = (itemId: string) => {
    setOrder((prevOrder) => prevOrder.filter((item) => item.id !== itemId));
  };

  const clearOrder = () => {
    setOrder([]);
    setTableNumber('');
  };

  const completeOrder = (completedOrder: Omit<Order, 'id' | 'timestamp' | 'orderType' | 'tableNumber'>) => {
    const newOrder: Order = {
      ...completedOrder,
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
      orderType: orderType,
      ...(orderType === 'Dine In' && { tableNumber: tableNumber }),
    };
    setOrders([...orders, newOrder]);
    clearOrder();
    toast({
      title: 'Payment Successful',
      description: 'The order has been completed and saved.',
    });
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Order Details</h2>
            <div className="flex items-center gap-4">
              <ToggleGroup 
                type="single" 
                value={orderType} 
                onValueChange={(value: 'Dine In' | 'Delivery') => {
                  if(value) setOrderType(value)
                }}
                className="bg-background rounded-lg p-1 border"
              >
                <ToggleGroupItem value="Dine In" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <Utensils /> Dine In
                </ToggleGroupItem>
                <ToggleGroupItem value="Delivery" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <Bike /> Delivery
                </ToggleGroupItem>
              </ToggleGroup>
              {orderType === 'Dine In' && (
                <div className="w-48">
                  <Label htmlFor="table-number" className="mb-2 block text-sm font-medium">Table Number</Label>
                  <Input 
                    id="table-number"
                    placeholder="e.g., 12" 
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <MenuGrid onAddToOrder={addToOrder} />
        </div>
        <div className="mt-8 lg:mt-0">
          <Bill
            orderItems={order}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromOrder}
            onClearOrder={clearOrder}
            onCompleteOrder={completeOrder}
            onAddToOrder={addToOrder}
            orderType={orderType}
            tableNumber={tableNumber}
          />
        </div>
      </div>
    </div>
  );
}
