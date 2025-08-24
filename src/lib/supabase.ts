
import { createClient } from '@supabase/supabase-js';
import type { Order, MenuItem } from '@/types';

// Add the following to your .env.local file to connect to your Supabase instance:
// NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
// NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const fromSupabase = (order: any): Order => {
    if (!order) return order;
    return {
        id: order.id,
        created_at: order.date,
        items: order.items,
        subtotal: order.sub_total ?? 0,
        tax: order.gst ?? 0,
        discount: order.discount ?? 0,
        total: order.total ?? 0,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_type: order.order_type,
        table_number: order.table_number,
        status: order.status,
    }
}

const toSupabase = (order: Partial<Order>) => {
    const payload: {[key: string]: any} = {};

    if (order.status) payload.status = order.status;
    if (order.items) payload.items = order.items;
    if (order.subtotal !== undefined) payload.sub_total = order.subtotal;
    if (order.tax !== undefined) payload.gst = order.tax;
    if (order.total !== undefined) payload.total = order.total;
    if (order.discount !== undefined) payload.discount = order.discount;
    if (order.order_type) payload.order_type = order.order_type;
    
    // Only include table_number if it has a value.
    if (order.table_number) {
        payload.table_number = order.table_number;
    }

    if (order.payment_method) {
      payload.payment_status = 'paid';
      payload.payment_method = order.payment_method;
    } else if(order.payment_status) {
        payload.payment_status = order.payment_status;
    }

    return payload;
}

export const getMenuItems = async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase.from('menu_items').select('*');
    if (error) {
        console.error("Error fetching menu items:", error);
        return [];
    }
    // Ensure rate is always a number
    return data.map(item => ({ ...item, rate: Number(item.rate) })) as MenuItem[];
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
        .in('status', ['received', 'preparing', 'ready'])
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching active orders:", error);
        return [];
    }
    return (data as any[]).map(fromSupabase);
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
    return (data as any[]).map(fromSupabase);
}

export const createOrder = async (order: Omit<Order, 'id' | 'created_at'>): Promise<Order | null> => {
    const payload = toSupabase(order);
    
    // Ensure essential fields for creation are present
    if (!payload.items) {
        console.error("Error creating order: items are missing.");
        return null;
    }
    if (!payload.order_type) {
        console.error("Error creating order: order_type is missing.");
        return null;
    }
    // Set a valid initial status if not present
    if (!payload.status) {
        payload.status = 'received';
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
    return fromSupabase(data);
}


export const updateOrder = async (orderId: number, updates: Partial<Order>): Promise<Order | null> => {
    const updatePayload = toSupabase(updates);

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
    return fromSupabase(data);
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
