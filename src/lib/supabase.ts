
import { createClient } from '@supabase/supabase-js';
import type { Order, MenuItem, KitchenOrder, User, RestaurantSettings } from '@/types';

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
        created_at: order.date, // Map 'date' from DB to 'created_at' in app
        items: Array.isArray(order.items) ? order.items : [],
        subtotal: order.sub_total ?? 0,
        tax: order.gst ?? 0,
        total: order.total ?? 0,
        payment_method: order.payment_method,
        payment_status: order.payment_status,
        order_type: order.order_type,
        table_number: order.table_number,
        status: order.status,
        phone_no: order.phone_no,
        flat_no: order.flat_no,
        building_no: order.building_no,
        address: order.address,
    }
}

const toSupabase = (order: Order) => {
    // Tax calculation is now handled on the client with settings
    // We just store the final calculated values
    const payload: { [key: string]: any } = {
        date: order.created_at || new Date().toISOString(),
        items: order.items, 
        sub_total: order.subtotal,
        gst: order.tax,
        total: order.total,
        order_type: order.order_type,
        table_number: order.table_number,
        payment_method: order.payment_method,
        payment_status: order.payment_status ?? 'unpaid',
        status: order.status,
        phone_no: order.phone_no,
        flat_no: order.flat_no,
        building_no: order.building_no,
        address: order.address,
    };
    
    // Do not include id for insert operations
    if (order.id > 0) {
        payload.id = order.id;
    }

    return payload;
}


export const getMenuItems = async (): Promise<MenuItem[]> => {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .eq('available', true)
        .order('name');
        
    if (error) {
        console.error("Error fetching menu items:", error);
        return [];
    }
    return (data || []).map(item => ({ ...item, rate: Number(item.rate) })) as MenuItem[];
}

export const addMenuItem = async (item: Partial<MenuItem>): Promise<MenuItem | null> => {
    const { data, error } = await supabase
        .from('menu_items')
        .insert(item)
        .select()
        .single();
    if (error) {
        console.error("Error adding menu item:", error);
        return null;
    }
    return data as MenuItem;
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

export const deleteMenuItem = async (itemId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemId);
    if (error) {
        console.error("Error deleting menu item:", error);
        return false;
    }
    return true;
}


export const getActiveOrders = async (): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
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
    if (order.status === 'pending') {
        return order;
    }

    const isNewOrder = order.id <= 0;
    
    if (isNewOrder) {
        const { id, ...insertPayload } = toSupabase(order);
        
        const { data, error } = await supabase
            .from('orders')
            .insert(insertPayload)
            .select()
            .single();

        if (error) {
            console.error("Error inserting order:", error);
            return null;
        }
        return fromSupabase(data);
    } else {
        const payload = toSupabase(order);
        
        const { data, error } = await supabase
            .from('orders')
            .update(payload)
            .eq('id', order.id)
            .select()
            .single();

        if (error) {
            console.error("Error updating order:", error);
            return null;
        }
        return fromSupabase(data);
    }
};

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

// --- User Authentication ---

export const signUp = async (userData: Omit<User, 'id' | 'role'>): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .insert({ ...userData, role: 'staff' }) // Default role
        .select()
        .single();

    if (error) {
        console.error("Error signing up:", error);
        return null;
    }
    return data as User;
}

export const signIn = async (login: string, password: string): Promise<User | null> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.ilike.${login},email.ilike.${login}`)
        .eq('password', password) // IMPORTANT: Storing plain text passwords is not secure. This is for demonstration only.
        .single();

    if (error || !data) {
        console.error("Error signing in:", error);
        return null;
    }
    return data as User;
}

// --- Restaurant Settings ---

export const getSettings = async (): Promise<RestaurantSettings | null> => {
    // This function runs on both server and client.
    // Avoid using localStorage directly here.
    const { data, error } = await supabase
        .from('restaurant_settings')
        .select('*')
        .eq('id', 1)
        .single();
    
    if(error && error.code !== 'PGRST116') { // PGRST116: "exact one row not found"
        console.error("Error fetching settings:", error);
        return null;
    }
    
    return data as RestaurantSettings | null;
}


export const updateSettings = async (settings: RestaurantSettings): Promise<RestaurantSettings | null> => {
    const { id, ...updateData } = settings;

    // Persist to local storage on the client for speed and offline capability
    if (typeof window !== 'undefined') {
        localStorage.setItem('restaurant_settings', JSON.stringify(settings));
    }

    // Then, attempt to save to Supabase
    const { data, error } = await supabase
        .from('restaurant_settings')
        .upsert({ ...updateData, id: 1 })
        .select()
        .single();
    
    if (error) {
        console.error("Error updating settings:", error);
        // A more robust solution might have a background sync queue.
        return null;
    }
    
    // Update local storage again with the definitive data from DB
    if (typeof window !== 'undefined') {
        localStorage.setItem('restaurant_settings', JSON.stringify(data));
    }
    return data as RestaurantSettings | null;
}
