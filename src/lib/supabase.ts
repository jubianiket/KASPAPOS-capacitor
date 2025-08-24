
import { createClient } from '@supabase/supabase-js';
import type { Order, MenuItem, KitchenOrder, OrderItem } from '@/types';

// Add the following to your .env.local file to connect to your Supabase instance:
// NEXT_PUBLIC_SUPABASE_URL="YOUR_SUPABASE_URL"
// NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TAX_RATE = 0.05; // 5%

const fromSupabase = (order: any): Order => {
    if (!order) return order;
    return {
        id: order.id,
        created_at: order.date, // Map 'date' from DB to 'created_at' in app
        items: Array.isArray(order.items) ? order.items : [],
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
    const subtotal = order.items.reduce((acc, item) => acc + item.rate * item.quantity, 0);
    const tax = subtotal * TAX_RATE;
    const total = subtotal + tax - (order.discount ?? 0);
    
    // 'pending' is a client-side only status. It becomes 'received' when confirmed.
    // 'completed' is set when the order is finalized before payment.
    const dbStatus = order.status === 'completed' ? 'completed' : order.status === 'received' ? 'received' : 'received';

    const payload: { [key: string]: any } = {
        date: order.created_at,
        items: JSON.stringify(order.items), // Always stringify JSON for Supabase
        sub_total: subtotal,
        gst: tax,
        total: total,
        discount: order.discount ?? 0,
        order_type: order.order_type,
        table_number: order.table_number,
        payment_method: order.payment_method,
        payment_status: order.payment_status ?? 'unpaid',
        status: dbStatus,
    };
    
    if (order.id > 0) {
        payload.id = order.id;
    }
    
    return payload;
}


export const getMenuItems = async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase.from('menu_items').select('*');
    if (error) {
        console.error("Error fetching menu items:", error);
        return [];
    }
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
        .in('status', ['received', 'completed']) 
        .neq('payment_status', 'paid') 
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
        .eq('payment_status', 'paid') 
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
        .upsert(payload, { onConflict: 'id' })
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
