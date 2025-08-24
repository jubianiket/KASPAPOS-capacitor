

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
import { getActiveOrders, updateOrder, createOrder, deleteOrder } from '@/lib/supabase';

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
    .filter(o => o.order_type === 'dine-in' && o.table_number && o.status !== 'completed')
    .map(o => o.table_number!);

  useEffect(() => {
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    
    if (currentOrderType === 'dine-in' && tableNumber) {
        const existingOrder = activeOrders.find(o => o.table_number === tableNumber && o.status !== 'completed');
        setActiveOrder(existingOrder || null);
    } else if (currentOrderType === 'delivery') {
        // Since delivery orders aren't tied to a table, we need a better way to manage them.
        // For simplicity, we find the first active delivery order.
        // A real-world app might have a more sophisticated way to handle multiple delivery orders.
        const deliveryOrder = activeOrders.find(o => o.order_type === 'delivery' && o.status !== 'completed');
        setActiveOrder(deliveryOrder || null);
    } else {
      setActiveOrder(null);
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

  const updateOrderItems = async (orderId: number, newItems: OrderItem[]) => {
      const orderToUpdate = activeOrders.find(o => o.id === orderId);
      if (!orderToUpdate) return;
      
      const oldOrder = { ...orderToUpdate };
      
      // Optimistic update
      const updatedOrder = { ...orderToUpdate, items: newItems };
      setActiveOrder(updatedOrder);
      setActiveOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
      
      // DB update
      const result = await updateOrder(orderId, { items: newItems });
      if (!result) {
          // Revert on failure
          setActiveOrder(oldOrder);
          setActiveOrders(prev => prev.map(o => o.id === orderId ? oldOrder : o));
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to update order.' });
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
        newItems = [...activeOrder.items, { ...item, quantity: 1, rate: item.rate }];
      }
      await updateOrderItems(activeOrder.id, newItems);
    } else {
      // Create a new order
      const newOrderData: Omit<Order, 'id' | 'created_at'> = {
          items: [{ ...item, quantity: 1, rate: item.rate }],
          subtotal: 0, tax: 0, discount: 0, total: 0,
          order_type: currentOrderType,
          table_number: tableNumber, // Pass the table number for dine-in
          status: 'received',
      };
      const newOrder = await createOrder(newOrderData);
      if(newOrder) {
        setActiveOrders(prev => [...prev, newOrder]);
        setActiveOrder(newOrder);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create order.' });
      }
    }
  };

  const updateQuantity = (itemId: number, quantity: number) => {
     if (!activeOrder) return;
    if (quantity <= 0) {
      removeFromOrder(itemId);
    } else {
       const newItems = activeOrder.items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
       updateOrderItems(activeOrder.id, newItems);
    }
  };

  const removeFromOrder = (itemId: number) => {
    if (!activeOrder) return;
    const newItems = activeOrder.items.filter((item) => item.id !== itemId);
    updateOrderItems(activeOrder.id, newItems);
  };

  const clearOrder = async () => {
    if(!activeOrder) return;

    // A confirmed order should be emptied, not deleted.
    if(activeOrder.status !== 'completed' && activeOrder.items.length > 0) {
        await updateOrderItems(activeOrder.id, []);
        return;
    }

    // No items in order, safe to delete
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
        setActiveOrder(null);
        
        // Reset the UI based on order type
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
                        orders={activeOrders} 
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
            onAddToOrder={addToOrder}
          />
        </div>
      </div>
    </div>
  );
}
