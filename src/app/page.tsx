
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Bill from '@/components/bill';
import MenuGrid from '@/components/menu-grid';
import type { OrderItem, MenuItem, Order } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Utensils, Bike } from 'lucide-react';
import TableSelection from '@/components/table-selection';
import { Skeleton } from '@/components/ui/skeleton';
import ActiveOrders from '@/components/active-orders';
import { getActiveOrders, saveOrder, deleteOrder } from '@/lib/supabase';

// Helper to generate temporary client-side IDs
const tempId = () => -Math.floor(Math.random() * 1000000);

export default function Home() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery'>('Dine In');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');


  const fetchOrders = useCallback(async () => {
      setIsLoading(true);
      const orders = await getActiveOrders();
      setActiveOrders(orders);
      setIsLoading(false);
  }, []);

  useEffect(() => {
    setIsClient(true);
    fetchOrders();
  }, [fetchOrders]);

  const occupiedTables = activeOrders
    .filter(o => o.order_type === 'dine-in' && o.table_number && o.status !== 'completed' && o.id! > 0)
    .map(o => o.table_number!);

  useEffect(() => {
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    
    if (currentOrderType === 'dine-in') {
      if (tableNumber) {
        const existingOrder = activeOrders.find(o => o.table_number === tableNumber && o.status !== 'completed');
        setActiveOrder(existingOrder || null);
      } else {
        setActiveOrder(null);
      }
    } else { // Delivery
        const deliveryOrder = activeOrders.find(o => o.order_type === 'delivery' && o.status !== 'completed');
        setActiveOrder(deliveryOrder || null);
    }
  }, [tableNumber, orderType, activeOrders]);
  
  const handleSelectOrder = (orderId: number) => {
    const selected = activeOrders.find(o => o.id === orderId);
    if(selected) {
        if (selected.order_type === 'dine-in') {
            setOrderType('Dine In');
            setTableNumber(selected.table_number || null);
        } else {
            setOrderType('Delivery');
            setTableNumber(null);
        }
        setActiveOrder(selected);
    }
  }
  
  const updateAndSaveOrder = async (order: Order) => {
    const isNew = !order.id || order.id < 0;
    const oldOrderState = activeOrder ? { ...activeOrder } : null;

    // Optimistic UI update
    setActiveOrder(order);
    if (isNew) {
      setActiveOrders(prev => [...prev, order]);
    } else {
      setActiveOrders(prev => prev.map(o => o.id === order.id ? order : o));
    }
    
    // Do not save pending orders to DB
    if(order.status === 'pending') {
      return order;
    }

    const savedOrder = await saveOrder(order);

    if (savedOrder) {
      // Update state with the actual data from the database
      setActiveOrder(savedOrder);
      setActiveOrders(prev => {
        const newOrders = prev.filter(o => o.id !== order.id);
        return [...newOrders, savedOrder];
      });
    } else {
      // Revert on failure
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save order.' });
      if (oldOrderState) {
        setActiveOrder(oldOrderState);
        setActiveOrders(prev => prev.map(o => o.id === oldOrderState.id ? oldOrderState : o));
      } else {
        setActiveOrder(null);
        setActiveOrders(prev => prev.filter(o => o.id !== order.id));
      }
    }
    return savedOrder;
  }
  
  const confirmOrder = async () => {
    if (activeOrder && activeOrder.status === 'pending') {
        const confirmedOrder = {
            ...activeOrder,
            status: 'received' as const,
        }
        await updateAndSaveOrder(confirmedOrder);
        toast({
            title: 'Order Confirmed',
            description: 'The order has been sent to the kitchen.'
        });
    }
  }


  const addToOrder = async (item: MenuItem) => {
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    if (currentOrderType === 'dine-in' && !tableNumber) {
        toast({
            variant: "destructive",
            title: "No table selected",
            description: "Please select a table before adding items.",
        });
        return;
    }

    const itemToAdd: OrderItem = { ...item, quantity: 1, rate: Number(item.rate) };

    let orderToUpdate: Order;

    if (activeOrder) {
      const existingItem = activeOrder.items.find((orderItem) => orderItem.id === item.id);
      let newItems: OrderItem[];

      if (existingItem) {
        newItems = activeOrder.items.map((orderItem) =>
          orderItem.id === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        newItems = [...activeOrder.items, itemToAdd];
      }
      orderToUpdate = {...activeOrder, items: newItems };

    } else {
      // Create a new order object
      orderToUpdate = {
          id: tempId(), // Temporary client-side ID
          items: [itemToAdd],
          subtotal: 0, tax: 0, discount: 0, total: 0,
          order_type: currentOrderType,
          table_number: currentOrderType === 'dine-in' ? tableNumber : null,
          status: 'pending', // Start as pending
          created_at: new Date().toISOString(),
      };
    }
    await updateAndSaveOrder(orderToUpdate);
  };

  const updateQuantity = (itemId: number, quantity: number) => {
     if (!activeOrder) return;
    if (quantity <= 0) {
      removeFromOrder(itemId);
    } else {
       const newItems = activeOrder.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
       updateAndSaveOrder({ ...activeOrder, items: newItems });
    }
  };

  const removeFromOrder = (itemId: number) => {
    if (!activeOrder) return;
    const newItems = activeOrder.items.filter((item) => item.id !== itemId);
    updateAndSaveOrder({ ...activeOrder, items: newItems });
  };

  const clearOrder = async () => {
    if(!activeOrder) return;

    // If order is pending and not saved, just clear it from local state
    if (activeOrder.status === 'pending') {
        setActiveOrder(null);
        setActiveOrders(prev => prev.filter(o => o.id !== activeOrder.id));
        return;
    }

    if(activeOrder.items.length === 0) {
      if (!activeOrder.id || activeOrder.id < 0) {
        setActiveOrder(null);
        return;
      }
      const success = await deleteOrder(activeOrder.id);
      if (success) {
          const newActiveOrders = activeOrders.filter(o => o.id !== activeOrder.id)
          setActiveOrders(newActiveOrders);
          setActiveOrder(null);
          if(activeOrder.order_type === 'dine-in') {
            setTableNumber(null);
          }
      } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to clear order.' });
      }
      return;
    }

    await updateAndSaveOrder({ ...activeOrder, items: []});
  };

  const completeOrder = async (completedOrder: Order) => {
    const updatedOrder = await saveOrder({
        ...completedOrder,
        status: 'completed',
    });
    
    if (updatedOrder) {
        setActiveOrders(activeOrders.filter(o => o.id !== completedOrder.id));
        setActiveOrder(null);
        
        if(completedOrder.order_type === 'dine-in') {
            setTableNumber(null);
        }

        toast({
          title: 'Payment Successful',
          description: 'The order has been completed and saved.',
        });
        return updatedOrder;
    } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to complete order.' });
        return null;
    }
  };
  
  const handleOrderTypeChange = (value: 'Dine In' | 'Delivery') => {
      if(value) {
        setOrderType(value);
        setTableNumber(null);
        setActiveOrder(null);
      }
  }

  const handleCategoryChange = (value: string) => {
    if (value) {
      setSelectedCategory(value);
    }
  };

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
            {isClient && !isLoading && activeOrders.length > 0 && (
                <div className="mb-6">
                   <ActiveOrders 
                        orders={activeOrders.filter(o => o.id! > 0)} 
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
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Menu Categories</h3>
                <ToggleGroup 
                    type="single" 
                    value={selectedCategory} 
                    onValueChange={handleCategoryChange}
                    className="flex-wrap justify-start"
                >
                {categories.map(category => (
                    <ToggleGroupItem key={category} value={category}>
                        {category}
                    </ToggleGroupItem>
                ))}
                </ToggleGroup>
            </div>
            <MenuGrid 
              onAddToOrder={addToOrder}
              onCategoriesLoad={setCategories}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
        <div className="mt-8 lg:mt-0">
          <Bill
            order={activeOrder}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromOrder}
            onClearOrder={clearOrder}
            onCompleteOrder={completeOrder}
            onConfirmOrder={confirmOrder}
            onAddToOrder={addToOrder}
          />
        </div>
      </div>
    </div>
  );
}
