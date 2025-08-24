"use client";

import React, { useState, useEffect } from 'react';
import Bill from '@/components/bill';
import MenuGrid from '@/components/menu-grid';
import type { OrderItem, MenuItem, Order } from '@/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Utensils, Bike } from 'lucide-react';
import TableSelection from '@/components/table-selection';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeOrders, setActiveOrders] = useLocalStorage<Order[]>('activeOrders', []);
  const [completedOrders, setCompletedOrders] = useLocalStorage<Order[]>('orders', []);
  const [isClient, setIsClient] = useState(false);
  
  const { toast } = useToast();
  
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery'>('Dine In');
  const [tableNumber, setTableNumber] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
  }, []);

  const occupiedTables = activeOrders
    .filter(o => o.orderType === 'Dine In' && o.tableNumber && o.status === 'confirmed')
    .map(o => o.tableNumber!);

  useEffect(() => {
    // When tableNumber changes, find if there's an active order for it
    if (orderType === 'Dine In') {
        if (tableNumber) {
            const existingOrder = activeOrders.find(o => o.tableNumber === tableNumber && o.status === 'confirmed');
            if (existingOrder) {
                setActiveOrder(existingOrder);
            } else {
                // Start a new pending order for this table
                const newPendingOrder: Order = {
                id: `pending-${tableNumber}-${Date.now()}`,
                items: [],
                subtotal: 0,
                tax: 0,
                discount: 0,
                total: 0,
                timestamp: new Date().toISOString(),
                orderType: 'Dine In',
                tableNumber: tableNumber,
                status: 'pending',
                };
                setActiveOrder(newPendingOrder);
            }
        } else {
             setActiveOrder(null);
        }
    } else if (orderType === 'Delivery') {
        // Always have a fresh pending order for delivery
        const newDeliveryOrder: Order = {
            id: `pending-delivery-${Date.now()}`,
            items: [],
            subtotal: 0,
            tax: 0,
            discount: 0,
            total: 0,
            timestamp: new Date().toISOString(),
            orderType: 'Delivery',
            status: 'pending',
        };
        setActiveOrder(newDeliveryOrder);
    } else {
      setActiveOrder(null);
    }
  }, [tableNumber, orderType, activeOrders]);

  const updateOrderItems = (newItems: OrderItem[]) => {
    if (!activeOrder) return;

    const newActiveOrder = { ...activeOrder, items: newItems };
    setActiveOrder(newActiveOrder);
    
    // Update in activeOrders list if it was a confirmed order
    if (newActiveOrder.status === 'confirmed') {
        const updatedActiveOrders = activeOrders.map(o => o.id === newActiveOrder.id ? newActiveOrder : o);
        setActiveOrders(updatedActiveOrders);
    }
  };

  const addToOrder = (item: MenuItem) => {
    if (!activeOrder) {
        toast({
            variant: "destructive",
            title: "No order selected",
            description: "Please select a table for Dine-In orders or switch to Delivery.",
        });
        return;
    }

    const existingItem = activeOrder.items.find((orderItem) => orderItem.id === item.id);
    let newItems: OrderItem[];

    if (existingItem) {
      newItems = activeOrder.items.map((orderItem) =>
        orderItem.id === item.id
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      );
    } else {
      newItems = [...activeOrder.items, { ...item, quantity: 1 }];
    }
    updateOrderItems(newItems);
  };

  const updateQuantity = (itemId: string, quantity: number) => {
     if (!activeOrder) return;
    if (quantity <= 0) {
      removeFromOrder(itemId);
    } else {
       const newItems = activeOrder.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
       updateOrderItems(newItems);
    }
  };

  const removeFromOrder = (itemId: string) => {
    if (!activeOrder) return;
    const newItems = activeOrder.items.filter((item) => item.id !== itemId);
    updateOrderItems(newItems);
  };

  const clearOrder = () => {
    if(!activeOrder) return;
    if(activeOrder.status === 'pending') {
        if(activeOrder.orderType === 'Dine In') {
            setActiveOrder(null);
            setTableNumber('');
        } else {
             // For delivery, just clear items
            updateOrderItems([]);
        }
    } else {
        // Confirmed order cannot be cleared, only items removed
        updateOrderItems([]);
    }
  };

  const confirmOrder = (confirmedOrder: Order) => {
    const newId = confirmedOrder.orderType === 'Dine In' 
        ? `confirmed-${confirmedOrder.tableNumber}-${Date.now()}`
        : `confirmed-delivery-${Date.now()}`;

    const newConfirmedOrder: Order = {
      ...confirmedOrder,
      id: newId,
      status: 'confirmed',
      timestamp: new Date().toISOString(),
    };
    
    // For dine-in, we replace the pending order with the confirmed one.
    // For delivery, we just add it.
    const otherActiveOrders = activeOrders.filter(o => o.id !== confirmedOrder.id);
    setActiveOrders([...otherActiveOrders, newConfirmedOrder]);
    setActiveOrder(newConfirmedOrder);
    
    const toastTitle = confirmedOrder.orderType === 'Dine In'
        ? `Order for Table ${confirmedOrder.tableNumber} Confirmed`
        : 'Delivery Order Confirmed';

    toast({
      title: toastTitle,
      description: 'You can now add more items or proceed to payment.',
    });
  };

  const completeOrder = (completedOrder: Order) => {
    const newCompletedOrder: Order = {
        ...completedOrder,
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    
    setCompletedOrders([...completedOrders, newCompletedOrder]);
    
    // Remove from active orders
    setActiveOrders(activeOrders.filter(o => o.id !== completedOrder.id));
    
    if(completedOrder.orderType === 'Dine In') {
        setActiveOrder(null);
        setTableNumber('');
    } else {
        // Start a fresh delivery order
        const newDeliveryOrder: Order = {
            id: `pending-delivery-${Date.now()}`,
            items: [], subtotal: 0, tax: 0, discount: 0, total: 0,
            timestamp: new Date().toISOString(),
            orderType: 'Delivery',
            status: 'pending',
        };
        setActiveOrder(newDeliveryOrder);
    }


    toast({
      title: 'Payment Successful',
      description: 'The order has been completed and saved.',
    });
  };
  
  const handleOrderTypeChange = (value: 'Dine In' | 'Delivery') => {
      if(value) {
        if(activeOrder && activeOrder.items.length > 0 && activeOrder.status === 'pending') {
            const switchConfirmed = confirm("You have a pending order. Do you want to discard it and switch order type?");
            if(!switchConfirmed) return;
        }
        setOrderType(value);
        setTableNumber('');
        setActiveOrder(null);
      }
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-8">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-3">Order Details</h2>
            <div className="flex items-center gap-4 mb-6">
              <ToggleGroup 
                type="single" 
                value={orderType} 
                onValueChange={handleOrderTypeChange}
                className="bg-background rounded-lg p-1 border"
              >
                <ToggleGroupItem value="Dine In" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <Utensils /> Dine In
                </ToggleGroupItem>
                <ToggleGroupItem value="Delivery" className="gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                  <Bike /> Delivery
                </ToggleGroupItem>
              </ToggleGroup>
            </div>
            {orderType === 'Dine In' && (
              <div className="mb-6">
                {!isClient ? (
                  <div>
                      <Skeleton className="h-8 w-48 mb-3" />
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <Skeleton key={i} className="aspect-square" />
                        ))}
                      </div>
                  </div>
                ) : (
                  <TableSelection 
                    selectedTable={tableNumber} 
                    onSelectTable={setTableNumber}
                    occupiedTables={occupiedTables}
                  />
                )}
              </div>
            )}
          </div>
          <MenuGrid onAddToOrder={addToOrder} />
        </div>
        <div className="mt-8 lg:mt-0">
          <Bill
            order={activeOrder}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromOrder}
            onClearOrder={clearOrder}
            onConfirmOrder={confirmOrder}
            onCompleteOrder={completeOrder}
            onAddToOrder={addToOrder}
          />
        </div>
      </div>
    </div>
  );
}
