
import { createClient } from '@supabase/supabase-js';
import type { Order, MenuItem, KitchenOrder } from '@/types';

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

const toSupabase = (order: Order) => {
    const payload: { [key: string]: any } = {
        items: order.items,
        sub_total: order.subtotal,
        gst: order.tax,
        total: order.total,
        discount: order.discount,
        order_type: order.order_type,
        table_number: order.table_number,
        date: order.created_at,
        payment_method: order.payment_method,
        payment_status: order.payment_status ?? 'unpaid', // Ensure payment_status is always set
    };

    // Only include the ID if it's a real, positive number for upsert.
    if (order.id && order.id > 0) {
        payload.id = order.id;
    }

    // The only valid statuses for the 'orders' table are 'received' and 'completed'.
    if (order.status === 'completed') {
        payload.status = 'completed';
    } else {
        // Any other state (including client-side 'pending') should be 'received' in the database.
        payload.status = 'received';
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
        .eq('status', 'received')
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


export const saveOrder = async (order: Order): Promise<Order | null> => {
    const payload = toSupabase(order);
    
    const { data, error } = await supabase
        .from('orders')
        .upsert(payload)
        .select()
        .single();
    
    if (error) {
        console.error("Error saving order:", error);
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

export const createKitchenOrder = async (order: Order): Promise<KitchenOrder | null> => {
    if (!order.id || order.id < 0) {
        console.error("Cannot create kitchen order without a valid main order ID.");
        return null;
    }
    
    const payload: Omit<KitchenOrder, 'id' | 'created_at'> = {
        order_id: order.id,
        items: order.items,
        order_type: order.order_type,
        table_number: order.table_number,
        status: 'preparing'
    }

    const { data, error } = await supabase
        .from('kitchen_orders')
        .insert(payload)
        .select()
        .single();

    if(error) {
        console.error("Error creating kitchen order:", error);
        return null;
    }
    
    return data as KitchenOrder;
}
