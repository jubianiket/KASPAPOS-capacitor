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

export const getActiveOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching active orders:", error);
        return [];
    }
    return data as Order[];
};

export const getCompletedOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error("Error fetching completed orders:", error);
        return [];
    }
    return data as Order[];
}

export const createOrder = async (order: Omit<Order, 'id' | 'created_at'>): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .insert([order])
        .select()
        .single();
    
    if (error) {
        console.error("Error creating order:", error);
        return null;
    }
    return data as Order;
}


export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<Order | null> => {
    const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId)
        .select()
        .single();

    if (error) {
        console.error("Error updating order:", error);
        return null;
    }
    return data as Order;
}

export const deleteOrder = async (orderId: string): Promise<boolean> => {
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
