
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Bill from '@/components/bill';
import MenuGrid from '@/components/menu-grid';
import type { OrderItem, MenuItem, Order, User, RestaurantSettings } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Utensils, Bike } from 'lucide-react';
import TableSelection from '@/components/table-selection';
import { Skeleton } from '@/components/ui/skeleton';
import ActiveOrders from '@/components/active-orders';
import { getActiveOrders, saveOrder, deleteOrder, createKitchenOrder, getSettings } from '@/lib/supabase';
import DeliveryDetailsDialog from '@/components/delivery-details-dialog';
import CustomItemDialog from '@/components/custom-item-dialog';

// Helper to generate temporary client-side IDs
const tempId = () => -Math.floor(Math.random() * 1000000);

export default function Home() {
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isDeliveryDialogToggled, setDeliveryDialogToggled] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery'>('Dine In');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');


  const fetchInitialData = useCallback(async () => {
      setIsLoading(true);
      const [orders, fetchedSettings] = await Promise.all([
          getActiveOrders(),
          getSettings()
      ]);
      setActiveOrders(orders); // Fetches all non-paid orders
      setSettings(fetchedSettings);
      setIsLoading(false);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
        router.replace('/login');
    } else {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsClient(true);
        fetchInitialData();
    }
  }, [router, fetchInitialData]);

  const occupiedTables = activeOrders
    .filter(o => o.order_type === 'dine-in' && o.table_number && o.id! > 0)
    .map(o => o.table_number!);

  useEffect(() => {
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    
    if (currentOrderType === 'dine-in') {
      if (tableNumber) {
        const existingOrder = activeOrders.find(o => o.table_number === tableNumber);
        setActiveOrder(existingOrder || null);
      } else {
        setActiveOrder(null);
      }
    } else { // Delivery
        // Allow creating a new delivery order, or view the first non-completed one
        const deliveryOrder = activeOrders.find(o => o.order_type === 'delivery' && o.payment_status !== 'paid');
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
      if (!activeOrders.find(o => o.id === order.id)) {
        setActiveOrders(prev => [...prev, order]);
      }
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
        const newOrders = prev.filter(o => o.id !== order.id); // remove old version (temp or existing)
        return [...newOrders, savedOrder]; // add new version from DB
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
  
 const confirmOrder = async (deliveryDetails?: Partial<Order>) => {
    if (activeOrder && activeOrder.status === 'pending') {
      if (activeOrder.order_type === 'delivery' && !deliveryDetails) {
        setDeliveryDialogToggled(true);
        return;
      }
      
      const confirmedOrderData = {
          ...activeOrder,
          ...deliveryDetails,
          status: 'received' as const,
      }
      const savedMainOrder = await updateAndSaveOrder(confirmedOrderData);
      
      if (savedMainOrder) {
          const kitchenOrder = await createKitchenOrder(savedMainOrder);
          if (kitchenOrder) {
              toast({
                  title: 'Order Confirmed',
                  description: 'The order has been sent to the kitchen.'
              });
          } else {
              toast({
                  variant: 'destructive',
                  title: 'Kitchen Order Failed',
                  description: 'The order was confirmed but could not be sent to the kitchen. Please check system status.',
              });
          }
      }
    }
  }
  
  const markAsCompleted = async () => {
      if (activeOrder && activeOrder.status === 'received') {
          const completedOrderData = {
              ...activeOrder,
              status: 'completed' as const,
          }
          await updateAndSaveOrder(completedOrderData);
      }
  }


  const addToOrder = async (item: MenuItem, portion: string) => {
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    if (currentOrderType === 'dine-in' && !tableNumber) {
        toast({
            variant: "destructive",
            title: "No table selected",
            description: "Please select a table before adding items to a Dine In order.",
        });
        return;
    }

    // A unique key for an order item is now its ID and its portion
    const itemKey = `${item.id}-${portion}`;

    const itemToAdd: OrderItem = { ...item, quantity: 1, rate: Number(item.rate), portion };

    let orderToUpdate: Order;

    if (activeOrder) {
      const existingItem = activeOrder.items.find(
        (orderItem) => `${orderItem.id}-${orderItem.portion}` === itemKey
      );
      
      let newItems: OrderItem[];

      if (existingItem) {
        newItems = activeOrder.items.map((orderItem) =>
          `${orderItem.id}-${orderItem.portion}` === itemKey
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      } else {
        newItems = [...activeOrder.items, itemToAdd];
      }
      orderToUpdate = {...activeOrder, items: newItems };

    } else {
      // Create a new, complete order object
      orderToUpdate = {
          id: tempId(), // Temporary client-side ID
          items: [itemToAdd],
          subtotal: 0, 
          tax: 0, 
          total: 0,
          payment_status: 'unpaid',
          order_type: currentOrderType,
          table_number: currentOrderType === 'dine-in' ? tableNumber : null,
          status: 'pending', // Start as pending
          created_at: new Date().toISOString(),
      };
    }
    
    // Recalculate totals before saving
    const subtotal = orderToUpdate.items.reduce((acc, item) => acc + item.rate * item.quantity, 0);
    let tax = 0;
     if (settings && settings.tax_enabled) {
        if (settings.is_restaurant) {
            if (settings.cgst) tax += subtotal * (settings.cgst / 100);
            if (settings.igst) tax += subtotal * (settings.igst / 100);
        }
        if (settings.is_bar) {
            if (settings.vat) tax += subtotal * (settings.vat / 100);
        }
    }
    const total = subtotal + tax;

    orderToUpdate.subtotal = subtotal;
    orderToUpdate.tax = tax;
    orderToUpdate.total = total;
    
    const updatedOrder = await updateAndSaveOrder(orderToUpdate);

    if (updatedOrder) {
      toast({
          title: "Item Added",
          description: `${item.name} (${portion}) was added to the order.`
      });
    }
  };
  
    const addCustomItemToOrder = (itemName: string, itemRate: number) => {
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    if (currentOrderType === 'dine-in' && !tableNumber) {
        toast({
            variant: "destructive",
            title: "No table selected",
            description: "Please select a table before adding items to a Dine In order.",
        });
        return;
    }
    const customItem: MenuItem = {
      id: tempId(), // Use a temporary negative ID for custom items
      name: itemName,
      rate: itemRate,
      category: 'Custom',
      portion: 'Custom',
    };
    addToOrder(customItem, 'Custom');
  };


  const updateQuantity = (itemId: number, portion: string | undefined, quantity: number) => {
     if (!activeOrder) return;
    const itemKey = `${itemId}-${portion}`;

    if (quantity <= 0) {
      removeFromOrder(itemId, portion);
    } else {
       const newItems = activeOrder.items.map((item) =>
          `${item.id}-${item.portion}` === itemKey ? { ...item, quantity } : item
        );
       updateAndSaveOrder({ ...activeOrder, items: newItems });
    }
  };

  const removeFromOrder = (itemId: number, portion: string | undefined) => {
    if (!activeOrder) return;
    const itemKey = `${itemId}-${portion}`;
    const newItems = activeOrder.items.filter((item) => `${item.id}-${item.portion}` !== itemKey);
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

    // This handles clearing a confirmed order (e.g. customer cancels)
    if(activeOrder.id > 0) {
      const success = await deleteOrder(activeOrder.id);
      if (success) {
          const newActiveOrders = activeOrders.filter(o => o.id !== activeOrder.id)
          setActiveOrders(newActiveOrders);
          setActiveOrder(null);
          if(activeOrder.order_type === 'dine-in') {
            setTableNumber(null);
          }
          toast({ title: 'Order Cleared', description: 'The order has been removed.' });
      } else {
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to clear order.' });
      }
      return;
    }

    // Fallback for an empty but non-pending order
    await updateAndSaveOrder({ ...activeOrder, items: []});
  };

  const completeOrderAndPay = async (completedOrder: Order) => {
    const updatedOrder = await saveOrder({
      ...completedOrder,
      payment_status: 'paid',
    });

    if (updatedOrder) {
      toast({
        title: 'Payment Successful',
        description: 'The order has been completed and saved to history.',
      });
      return updatedOrder;
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to complete payment.',
      });
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

  const handleNewOrder = () => {
    setActiveOrder(null);
    setTableNumber(null);
    setOrderType('Dine In');
    fetchInitialData();
  };
  
  if (!isClient || !user) {
    return (
        <div className="flex justify-center items-center h-screen">
             <div className="text-center">
                <p>Loading...</p>
             </div>
        </div>
    )
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
       {activeOrder && activeOrder.order_type === 'delivery' && (
        <DeliveryDetailsDialog
          isOpen={isDeliveryDialogToggled}
          onOpenChange={setDeliveryDialogToggled}
          order={activeOrder}
          onConfirm={(details) => confirmOrder(details)}
        />
      )}
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
                    onSelectTable={(t) => {
                      setTableNumber(t);
                      const existingOrder = activeOrders.find(o => o.table_number === t);
                      setActiveOrder(existingOrder || null);
                    }}
                    occupiedTables={occupiedTables}
                    tableCount={settings?.table_count || 12}
                  />
                )}
              </div>
            )}
            <div className="mb-6">
                 <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold">Menu Categories</h3>
                    <CustomItemDialog onAddItem={addCustomItemToOrder} />
                </div>
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
            onCompleteOrder={completeOrderAndPay}
            onConfirmOrder={() => confirmOrder()}
            onNewOrder={handleNewOrder}
          />
        </div>
      </div>
    </div>
  );
}
