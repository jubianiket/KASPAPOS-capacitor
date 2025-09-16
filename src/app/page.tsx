

"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Bill from '@/components/bill';
import MenuGrid from '@/components/menu-grid';
import type { OrderItem, MenuItem, Order, User, Restaurant } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Utensils, Bike, Search, PlusCircle, Leaf, Drumstick } from 'lucide-react';
import TableSelection from '@/components/table-selection';
import { Skeleton } from '@/components/ui/skeleton';
import ActiveOrders from '@/components/active-orders';
import { saveOrder, deleteOrder, createKitchenOrder } from '@/lib/supabase';
import DeliveryDetailsDialog from '@/components/delivery-details-dialog';
import CustomItemDialog from '@/components/custom-item-dialog';
import { useData } from '@/hooks/use-data';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

// Helper to generate temporary client-side IDs
const tempId = () => -Math.floor(Math.random() * 1000000);

export default function Home() {
  const { menuItems: allMenuItems, isMenuLoading, settings, activeOrders, isOrdersLoading, onRefreshAll } = useData();
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isDeliveryDialogToggled, setDeliveryDialogToggled] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDietaryType, setSelectedDietaryType] = useState<string>('all');

  const router = useRouter();
  const { toast } = useToast();
  
  const [orderType, setOrderType] = useState<'Dine In' | 'Delivery'>('Dine In');
  const [tableNumber, setTableNumber] = useState<number | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const menuItems = useMemo(() => {
    let items = allMenuItems.filter(item => item.is_active);
    if(searchTerm) {
      items = items.filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedDietaryType !== 'all') {
      items = items.filter(item => item.dietary_type === selectedDietaryType);
    }
    return items;
  }, [allMenuItems, searchTerm, selectedDietaryType]);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
        router.replace('/login');
    } else {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsClient(true);
    }
  }, [router]);
  
  useEffect(() => {
      if (menuItems && menuItems.length > 0) {
        const uniqueCategories = ['All', ...Array.from(new Set(menuItems.map(item => item.category).filter(Boolean) as string[]))];
        setCategories(uniqueCategories);
        if (uniqueCategories.length > 0 && !uniqueCategories.includes(selectedCategory)) {
          setSelectedCategory('All');
        }
      }
  }, [menuItems, selectedCategory]);


  const occupiedTables = activeOrders
    .filter(o => o.order_type === 'dine-in' && o.table_number && o.status !== 'completed')
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
    }
    // For delivery, we no longer auto-select an order.
    // The user must explicitly select an active order or start adding items to create a new one.
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
    console.log('Updating/saving order:', { 
        orderId: order.id,
        items: order.items,
        status: order.status,
        isNew: !order.id || order.id < 0 
    });
    
    const isNew = !order.id || order.id < 0;

    // Recalculate totals before saving
    const subtotal = order.items.reduce((acc, item) => acc + item.rate * item.quantity, 0);
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

    const orderWithTotals = {
        ...order,
        subtotal,
        tax,
        total,
    }
    
    // Do not save pending orders to DB
    if(order.status === 'pending') {
      setActiveOrder(orderWithTotals);
      return orderWithTotals;
    }

    const savedOrder = await saveOrder(orderWithTotals);

    if (savedOrder) {
      await onRefreshAll(); // Refresh all data
      setActiveOrder(savedOrder);
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save order.' });
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
      
      if (savedMainOrder && settings?.kds_enabled) {
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
      } else if (savedMainOrder) {
        toast({
            title: 'Order Confirmed',
            description: 'The order has been confirmed successfully.',
        });
      }
    }
  }

  const addToOrder = async (item: MenuItem, portion: string) => {
    console.log('Adding to order:', { item, portion });
    
    if (!user?.restaurant_id) {
        console.error('No restaurant_id found');
        return;
    }
    
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    if (currentOrderType === 'dine-in' && !tableNumber) {
        console.log('No table selected for dine-in order');
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
          restaurant_id: user.restaurant_id
      };
    }
    
    const updatedOrder = await updateAndSaveOrder(orderToUpdate);

    if (updatedOrder) {
      toast({
          title: "Item Added",
          description: `${item.name} (${portion}) was added to the order.`
      });
    }
  };
  
    const addCustomItemToOrder = (itemName: string, itemRate: number) => {
    if (!user?.restaurant_id) return;
    const currentOrderType = orderType === 'Dine In' ? 'dine-in' : 'delivery';
    if (currentOrderType === 'dine-in' && !tableNumber) {
        toast({
            variant: "destructive",
            title: "No table selected",
            description: "Please select a table before adding items for a Dine In order.",
        });
        return;
    }
    // This is now an OrderItem, not a full MenuItem
    const customItem: OrderItem = {
      id: tempId(), // Use a temporary negative ID for custom items
      name: itemName,
      rate: itemRate,
      category: 'Custom',
      portion: 'Custom',
      is_active: true,
      restaurant_id: user.restaurant_id,
      dietary_type: 'Veg', // Default custom items to veg
      quantity: 1,
    };
    
    let orderToUpdate: Order;

    if (activeOrder) {
      orderToUpdate = {...activeOrder, items: [...activeOrder.items, customItem] };
    } else {
      orderToUpdate = {
          id: tempId(),
          items: [customItem],
          subtotal: 0, tax: 0, total: 0,
          payment_status: 'unpaid',
          order_type: currentOrderType,
          table_number: currentOrderType === 'dine-in' ? tableNumber : null,
          status: 'pending',
          created_at: new Date().toISOString(),
          restaurant_id: user.restaurant_id
      };
    }
    
    updateAndSaveOrder(orderToUpdate);

    toast({
        title: "Custom Item Added",
        description: `${itemName} was added to the order.`
    });
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
    if(!activeOrder || !user?.restaurant_id) return;

    // If order is pending and not saved, just clear it from local state
    if (activeOrder.status === 'pending') {
        setActiveOrder(null);
        return;
    }

    // This handles clearing a confirmed order (e.g. customer cancels)
    if(activeOrder.id > 0) {
      const success = await deleteOrder(activeOrder.id, user.restaurant_id);
      if (success) {
          await onRefreshAll();
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
      status: 'completed'
    });

    if (updatedOrder) {
      toast({
        title: 'Payment Successful',
        description: 'The order has been completed and saved to history.',
      });
       // The dialog will handle the next step, no need to refetch here
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
    onRefreshAll();
  };
  
  const handleNewDeliveryOrder = () => {
    setActiveOrder(null);
    setTableNumber(null);
    setOrderType('Delivery');
  };

  if (!isClient) {
    return (
        <div className="flex justify-center items-center h-screen">
             <div className="text-center">
                <p>Loading...</p>
             </div>
        </div>
    )
  }
  
  const pageIsLoading = isOrdersLoading || isMenuLoading;

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
              <div className="bg-muted p-1 rounded-lg border flex items-center">
                  <Button 
                    variant={orderType === 'Dine In' ? 'secondary' : 'ghost'} 
                    onClick={() => handleOrderTypeChange('Dine In')}
                    className="gap-2"
                  >
                     <Utensils /> Dine In
                  </Button>
                  <Button 
                    variant={orderType === 'Delivery' ? 'secondary' : 'ghost'} 
                    onClick={() => handleOrderTypeChange('Delivery')}
                    className="gap-2"
                  >
                     <Bike /> Delivery
                  </Button>
              </div>
               {orderType === 'Delivery' && (
                  <Button variant="outline" onClick={handleNewDeliveryOrder}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Delivery
                  </Button>
                )}
            </div>
            {isClient && !pageIsLoading && activeOrders.length > 0 && (
                <div className="mb-6">
                   <ActiveOrders 
                        orders={activeOrders.filter(o => o.order_type === (orderType === 'Dine In' ? 'dine-in' : 'delivery'))} 
                        onSelectOrder={handleSelectOrder}
                        activeOrderId={activeOrder?.id}
                   />
                </div>
            )}
            {orderType === 'Dine In' && (
              <div className="mb-6">
                {!isClient || pageIsLoading ? (
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
                      const existingOrder = activeOrders.find(o => o.table_number === t && o.status !== 'completed');
                      setActiveOrder(existingOrder || null);
                    }}
                    occupiedTables={occupiedTables}
                    tableCount={settings?.table_count || 12}
                  />
                )}
              </div>
            )}
            <div className="mb-6 space-y-4">
                <div className="flex gap-4">
                    <div className="relative flex-grow">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            placeholder="Search for menu items..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ToggleGroup
                      type="single"
                      variant="outline"
                      value={selectedDietaryType}
                      onValueChange={(value) => setSelectedDietaryType(value || 'all')}
                    >
                      <ToggleGroupItem value="all" aria-label="All items">All</ToggleGroupItem>
                      <ToggleGroupItem value="Veg" aria-label="Veg items"><Leaf className="h-4 w-4 text-green-600"/></ToggleGroupItem>
                      <ToggleGroupItem value="Non Veg" aria-label="Non-veg items"><Drumstick className="h-4 w-4 text-red-600"/></ToggleGroupItem>
                    </ToggleGroup>
                </div>

                 <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Menu Categories</h3>
                    <CustomItemDialog onAddItem={addCustomItemToOrder} />
                </div>
                <div className="relative">
                  <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex space-x-2 pb-4">
                       {isMenuLoading ? (
                         <Skeleton className="h-9 w-full" />
                       ) : (
                         categories.map(category => (
                           <Button
                             key={category}
                             variant={selectedCategory === category ? "secondary" : "outline"}
                             onClick={() => handleCategoryChange(category)}
                             className={cn("whitespace-nowrap")}
                           >
                             {category}
                           </Button>
                         ))
                       )}
                    </div>
                    <ScrollBar orientation="horizontal" />
                  </ScrollArea>
                </div>
            </div>
            <MenuGrid 
              menuItems={menuItems}
              isLoading={isMenuLoading}
              onAddToOrder={addToOrder}
              selectedCategory={selectedCategory}
            />
          </div>
        </div>
        <div className="mt-8 lg:mt-0">
          <Bill
            order={activeOrder}
            settings={settings}
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
