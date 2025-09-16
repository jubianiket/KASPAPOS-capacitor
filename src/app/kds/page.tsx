
'use client';

import { useEffect, useState, useCallback } from 'react';
import type { KitchenOrder, User } from '@/types';
import { getKitchenOrders, updateKitchenOrderStatus, supabase, getSettings } from '@/lib/supabase';
import KdsOrderCard from '@/components/kds-order-card';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function KDSPage() {
  const [orders, setOrders] = useState<KitchenOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isKdsEnabled, setIsKdsEnabled] = useState(false);
  const router = useRouter();

  const fetchOrders = useCallback(async (restaurantId: number) => {
    const kitchenOrders = await getKitchenOrders(restaurantId);
    setOrders(kitchenOrders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
  }, []);

  const handleUpdateStatus = async (order: KitchenOrder, status: 'preparing' | 'ready') => {
    if (!user?.restaurant_id || !isKdsEnabled) return;
    const success = await updateKitchenOrderStatus(order.id, order.order_id, user.restaurant_id, status);
    if (success) {
      // Optimistically update UI or refetch
      setOrders(prevOrders =>
        prevOrders.map(o =>
          o.id === order.id ? { ...o, status } : o
        )
      );
      if (status === 'ready') {
          setTimeout(() => {
              setOrders(prev => prev.filter(o => o.id !== order.id));
          }, 2000); // Remove from view after 2 seconds
      }
    }
  };
  
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const parsedUser: User = JSON.parse(userStr);
      setUser(parsedUser);
      if (parsedUser.restaurant_id) {
        setIsLoading(true);
        getSettings(parsedUser.restaurant_id).then(settings => {
          const kdsEnabled = !!settings?.kds_enabled;
          setIsKdsEnabled(kdsEnabled);
          if (kdsEnabled) {
            fetchOrders(parsedUser.restaurant_id!).finally(() => setIsLoading(false));
          } else {
            setIsLoading(false);
          }
        });
      }
    } else {
      router.replace('/login');
    }
  }, [router, fetchOrders]);


  useEffect(() => {
    if (!user?.restaurant_id || !isKdsEnabled) return;

    const channel = supabase
      .channel('kitchen-orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'kitchen_orders', filter: `restaurant_id=eq.${user.restaurant_id}` },
        (payload) => {
           console.log('[KDS] Real-time change received for my restaurant:', payload);
           fetchOrders(user.restaurant_id!);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };

  }, [user, fetchOrders, isKdsEnabled]);

  return (
    <div className="min-h-screen bg-muted/40 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Kitchen Display</h1>
           <Button variant="outline" asChild>
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to POS
                </Link>
           </Button>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        ) : !isKdsEnabled ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-card rounded-lg border">
            <h2 className="text-2xl font-semibold text-muted-foreground">KDS is Disabled</h2>
            <p className="mt-2 text-muted-foreground">Please enable the Kitchen Display System in the settings page.</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center bg-card rounded-lg border">
            <h2 className="text-2xl font-semibold text-muted-foreground">No Active Kitchen Orders</h2>
            <p className="mt-2 text-muted-foreground">New orders will appear here automatically.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {orders.filter(o => o.status === 'preparing').map(order => (
              <KdsOrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
