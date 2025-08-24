
"use client";

import React, { useState, useEffect } from 'react';
import Bill from '@/components/bill';
import MenuGrid from '@/components/menu-grid';
import type { OrderItem, MenuItem, Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Utensils, Bike } from 'lucide-react';
import TableSelection from '@/components/table-selection';
import { Skeleton } from '@/components/ui/skeleton';
import ActiveOrders from '@/components/active-orders';
import { getActiveOrders, updateOrder, createOrder, deleteOrder } from '@/lib/supabase';

export default function Home() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery'>('Dine In');
  const [tableNumber, setTableNumber] = useState<string>('');

  useEffect(() => {
    setIsClient(true);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
      setIsLoading(true);
      const orders = await getActiveOrders();
      setActiveOrders(orders);
      setIsLoading(false);
  };

  const occupiedTables = activeOrders
    .filter(o => o.order_type === 'Dine In' && o.table_number && o.status !== 'completed' && o.status !== 'pending')
    .map(o => o.table_number!);

  useEffect(() => {
    const manageOrder = async () => {
      if (orderType === 'Dine In') {
          if (tableNumber) {
              const existingOrder = activeOrders.find(o => o.table_number === tableNumber && o.status !== 'completed');
              if (existingOrder) {
                  setActiveOrder(existingOrder);
              } else {
                  // Look for a pending order for this table
                  let pendingOrder = activeOrders.find(o => o.table_number === tableNumber && o.status === 'pending');
                  if (!pendingOrder) {
                      // Start a new pending order for this table
                      const newOrder = await createOrder({
                          items: [],
                          subtotal: 0,
                          tax: 0,
                          discount: 0,
                          total: 0,
                          order_type: 'Dine In',
                          table_number: tableNumber,
                          status: 'pending',
                      });
                      if(newOrder) {
                        setActiveOrders(prev => [...prev, newOrder!]);
                        pendingOrder = newOrder;
                      }
                  }
                  setActiveOrder(pendingOrder);
              }
          } else {
               setActiveOrder(null);
          }
      } else if (orderType === 'Delivery') {
          // Find if there's a pending delivery order.
          let pendingDeliveryOrder = activeOrders.find(o => o.order_type === 'Delivery' && o.status === 'pending');
          if (!pendingDeliveryOrder) {
              const newOrder = await createOrder({
                  items: [],
                  subtotal: 0,
                  tax: 0,
                  discount: 0,
                  total: 0,
                  order_type: 'Delivery',
                  status: 'pending',
              });
              if (newOrder) {
                setActiveOrders(prev => [...prev, newOrder!]);
                pendingDeliveryOrder = newOrder;
              }
          }
           setActiveOrder(pendingDeliveryOrder);
      } else {
        setActiveOrder(null);
      }
    };
    
    manageOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableNumber, orderType]);
  
  const handleSelectOrder = (orderId: string) => {
    const selected = activeOrders.find(o => o.id === orderId);
    if(selected) {
        if (selected.order_type === 'Dine In' || selected.order_type === 'dine-in') {
            setOrderType('Dine In');
            setTableNumber(selected.table_number || '');
        } else {
            setOrderType('Delivery');
            setTableNumber('');
        }
        setActiveOrder(selected);
    }
  }

  const updateOrderItems = async (newItems: OrderItem[]) => {
    if (!activeOrder) return;

    // Optimistic update
    const oldOrder = activeOrder;
    const newActiveOrder = { ...activeOrder, items: newItems };
    setActiveOrder(newActiveOrder);
    
    // Update in activeOrders list
    const updatedActiveOrders = activeOrders.map(o => o.id === newActiveOrder.id ? newActiveOrder : o);
    setActiveOrders(updatedActiveOrders);
    
    // DB update
    const updatedOrder = await updateOrder(activeOrder.id, { items: newItems });
    if (!updatedOrder) {
        // Revert on failure
        setActiveOrder(oldOrder);
        setActiveOrders(activeOrders.map(o => o.id === oldOrder.id ? oldOrder : o));
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order.' });
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
      newItems = [...activeOrder.items, { ...item, quantity: 1, rate: item.rate }];
    }
    updateOrderItems(newItems);
  };

  const updateQuantity = (itemId: number, quantity: number) => {
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

  const removeFromOrder = (itemId: number) => {
    if (!activeOrder) return;
    const newItems = activeOrder.items.filter((item) => item.id !== itemId);
    updateOrderItems(newItems);
  };

  const clearOrder = async () => {
    if(!activeOrder) return;
    
    if(activeOrder.status === 'confirmed' || activeOrder.status === 'received' || activeOrder.status === 'preparing' || activeOrder.status === 'ready') {
        updateOrderItems([]);
        return;
    }

    // Pending orders are deleted
    if(activeOrder.status === 'pending') {
        const success = await deleteOrder(activeOrder.id);
        if (success) {
            setActiveOrders(prev => prev.filter(o => o.id !== activeOrder.id));
            if(activeOrder.order_type === 'Dine In') {
                setTableNumber('');
            }
            setActiveOrder(null);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to clear order.' });
        }
    }
  };

  const confirmOrder = async (confirmedOrder: Order) => {
    const updatedOrder = await updateOrder(confirmedOrder.id, { 
        status: 'received', 
        subtotal: confirmedOrder.subtotal,
        tax: confirmedOrder.tax,
        total: confirmedOrder.total,
        items: confirmedOrder.items
    });

    if (updatedOrder) {
        const updatedActiveOrders = activeOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o);
        setActiveOrders(updatedActiveOrders);
        setActiveOrder(updatedOrder);
        
        const toastTitle = (updatedOrder.order_type === 'Dine In' || updatedOrder.order_type === 'dine-in')
            ? `Order for Table ${updatedOrder.table_number} Confirmed`
            : 'Delivery Order Confirmed';

        toast({
          title: toastTitle,
          description: 'You can now add more items or proceed to payment.',
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to confirm order.' });
    }
  };

  const completeOrder = async (completedOrder: Order) => {
    const updatedOrder = await updateOrder(completedOrder.id, {
        status: 'completed',
        payment_method: completedOrder.payment_method,
        subtotal: completedOrder.subtotal,
        tax: completedOrder.tax,
        total: completedOrder.total,
    });
    
    if (updatedOrder) {
        // Remove from active orders
        setActiveOrders(activeOrders.filter(o => o.id !== completedOrder.id));
        
        // Reset the UI based on order type
        if(completedOrder.order_type === 'Dine In' || completedOrder.order_type === 'dine-in') {
            setActiveOrder(null);
            setTableNumber('');
        } else {
            setActiveOrder(null); // This will trigger useEffect to create a new one
            setOrderType('Delivery'); // Force re-evaluation
        }

        toast({
          title: 'Payment Successful',
          description: 'The order has been completed and saved.',
        });
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete order.' });
    }
  };
  
  const handleOrderTypeChange = async (value: 'Dine In' | 'Delivery') => {
      if(value) {
        if(activeOrder && activeOrder.items.length > 0 && activeOrder.status === 'pending') {
            const switchConfirmed = confirm("You have a pending order with items. Do you want to discard it and switch?");
            if(!switchConfirmed) return;

             // Remove the pending order from active orders
            const success = await deleteOrder(activeOrder.id);
            if (success) {
                setActiveOrders(prev => prev.filter(o => o.id !== activeOrder.id));
            } else {
                 toast({ variant: 'destructive', title: 'Error', description: 'Failed to discard pending order.' });
                 return;
            }
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
            <h2 className="text-xl font-semibold mb-3">Create Order</h2>
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
            {isClient && !isLoading && activeOrders.filter(o => o.status !== 'pending' && o.status !== 'completed').length > 0 && (
                <div className="mb-6">
                   <ActiveOrders 
                        orders={activeOrders.filter(o => o.status !== 'pending' && o.status !== 'completed')} 
                        onSelectOrder={handleSelectOrder}
                        activeOrderId={activeOrder?.id}
                   />
                </div>
            )}
            {orderType === 'Dine In' && (
              <div className="mb-6">
                {!isClient || isLoading ? (
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
