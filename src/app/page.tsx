"use client";

import React, { useState } from 'react';
import Bill from '@/components/bill';
import MenuGrid from '@/components/menu-grid';
import type { OrderItem, MenuItem, Order } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [order, setOrder] = useState<OrderItem[]>([]);
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
  const { toast } = useToast();

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
  };

  const completeOrder = (completedOrder: Omit<Order, 'id' | 'timestamp'>) => {
    const newOrder: Order = {
      ...completedOrder,
      id: new Date().toISOString(),
      timestamp: new Date().toISOString(),
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
          />
        </div>
      </div>
    </div>
  );
}
