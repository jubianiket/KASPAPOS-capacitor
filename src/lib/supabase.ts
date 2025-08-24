
import { createClient } from '@supabase/supabase-js';
import type { Order, MenuItem } from '@/types';

// Add the following to your .env.local file to connect to your Supabase instance:
// NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
// NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getMenuItems = async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase.from('menu_items').select('*');
    if (error) {
        console.error("Error fetching menu items:", error);
        return [];
    }
    return data as MenuItem[];
}

export const updateMenuItem = async (itemId: number, updates: Partial<MenuItem>): Promise<MenuItem | null> => {
    const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .eq('id', itemId)
        .select()
        .single();

    if (error) {
        console.error("Error updating menu item:", error);
        return null;
    }
    return data as MenuItem;
}

export const getActiveOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'confirmed', 'received', 'preparing', 'ready'])
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching active orders:", error);
        return [];
    }
    return (data as any[]).map(o => ({...o, created_at: o.date, subtotal: o.sub_total ?? 0, total: o.total ?? 0, tax: o.gst ?? 0, discount: 0 })) as Order[];
};

export const getCompletedOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .order('date', { ascending: false });
    
    if (error) {
        console.error("Error fetching completed orders:", error);
        return [];
    }
    return (data as any[]).map(o => ({...o, created_at: o.date, subtotal: o.sub_total ?? 0, total: o.total ?? 0, tax: o.gst ?? 0, discount: 0 })) as Order[];
}

export const createOrder = async (order: Omit<Order, 'id' | 'created_at'>): Promise<Order | null> => {
    const payload: { [key: string]: any } = {
        items: order.items,
        sub_total: order.subtotal,
        total: order.total,
        gst: order.tax,
        order_type: order.order_type,
        status: order.status
    };

    if (order.table_number) {
        payload.table_number = order.table_number;
    }

    const { data, error } = await supabase
        .from('orders')
        .insert([payload])
        .select()
        .single();
    
    if (error) {
        console.error("Error creating order:", error);
        return null;
    }
    const newOrder = {...(data as any), created_at: data.date, subtotal: data.sub_total ?? 0, total: data.total ?? 0, tax: data.gst ?? 0, discount: 0 } as Order;
    return newOrder;
}


export const updateOrder = async (orderId: number, updates: Partial<Order>): Promise<Order | null> => {
    const updatePayload: {[key: string]: any} = {};
    if (updates.status) updatePayload.status = updates.status;
    if (updates.items) updatePayload.items = updates.items;
    if (updates.subtotal !== undefined) updatePayload.sub_total = updates.subtotal;
    if (updates.tax !== undefined) updatePayload.gst = updates.tax;
    if (updates.total !== undefined) updatePayload.total = updates.total;
    if (updates.payment_method) {
      updatePayload.payment_status = 'paid';
      updatePayload.payment_method = updates.payment_method;
    }


    const { data, error } = await supabase
        .from('orders')
        .update(updatePayload)
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error("Error updating order:", error);
        return null;
    }
    const updatedOrder = {...(data as any), created_at: data.date, subtotal: data.sub_total ?? 0, total: data.total ?? 0, tax: data.gst ?? 0, discount: 0 } as Order;
    return updatedOrder;
}

export const deleteOrder = async (orderId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
    
    if (error) {
        console.error("Error deleting order:", error);
        return false;
    }
    return true;
}

