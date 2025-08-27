
import { createClient } from '@supabase/supabase-js';
import type { Order, MenuItem, KitchenOrder, User, Restaurant } from '@/types';

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
        restaurant_id: order.restaurant_id,
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
        restaurant_id: order.restaurant_id
    };
    
    // Do not include id for insert operations
    if (order.id > 0) {
        payload.id = order.id;
    }

    return payload;
}


export const getMenuItems = async (restaurantId: number): Promise<MenuItem[]> => {
    const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurantId)
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

export const updateMenuItem = async (itemId: number, restaurantId: number, updates: Partial<MenuItem>): Promise<MenuItem | null> => {
    const { data, error } = await supabase
        .from('menu_items')
        .update(updates)
        .match({ id: itemId, restaurant_id: restaurantId })
        .select()
        .single();

    if (error) {
        console.error("Error updating menu item:", error);
        return null;
    }
    return data as MenuItem;
}

export const deleteMenuItem = async (itemId: number, restaurantId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('menu_items')
        .delete()
        .match({ id: itemId, restaurant_id: restaurantId });
    if (error) {
        console.error("Error deleting menu item:", error);
        return false;
    }
    return true;
}


export const getActiveOrders = async (restaurantId: number): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
        .neq('payment_status', 'paid') 
        .order('date', { ascending: false });

    if (error) {
        console.error("Error fetching active orders:", error);
        return [];
    }
    return (data as any[]).map(fromSupabase);
};

export const getCompletedOrders = async (restaurantId: number): Promise<Order[]> => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurantId)
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
            .match({ id: order.id, restaurant_id: order.restaurant_id })
            .select()
            .single();

        if (error) {
            console.error("Error updating order:", error);
            return null;
        }
        return fromSupabase(data);
    }
};

export const deleteOrder = async (orderId: number, restaurantId: number): Promise<boolean> => {
    const { error } = await supabase
        .from('orders')
        .delete()
        .match({ id: orderId, restaurant_id: restaurantId });
    
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
        status: 'preparing',
        restaurant_id: order.restaurant_id,
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

// --- User Authentication & Restaurant Management ---

export const signUp = async (userData: Omit<User, 'id' | 'role' | 'restaurant_id'>): Promise<User | null> => {
    // 1. Check if user already exists
     const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${userData.username},email.eq.${userData.email}`)
        .single();
    
    if (existingUser) {
        console.error("User with this username or email already exists.");
        return null;
    }

    // 2. Create a new restaurant for the user
    const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({ restaurant_name: `${userData.name}'s Restaurant` })
        .select()
        .single();

    if (restaurantError || !restaurantData) {
        console.error("Error creating restaurant:", restaurantError);
        return null;
    }

    // 3. Create the new user and link them to the new restaurant
    const { data: newUserData, error: userError } = await supabase
        .from('users')
        .insert({
            ...userData,
            role: 'admin', // First user is the admin
            restaurant_id: restaurantData.id,
        })
        .select()
        .single();
    
    if (userError) {
        console.error("Error signing up:", userError);
        // Attempt to clean up the created restaurant if user creation fails
        await supabase.from('restaurants').delete().eq('id', restaurantData.id);
        return null;
    }

    return newUserData as User;
}

export const signIn = async (login: string, password: string): Promise<User | null> => {
    // This is not secure for production. Passwords should be hashed.
    // This is for demonstration purposes only.
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`username.eq.${login},email.eq.${login}`)
        .single();

    if (error || !data) {
        console.error("Sign in error or user not found:", error);
        return null;
    }

    // Manual password check (again, not secure)
    if (data.password === password) {
        return data as User;
    }

    return null;
}

// --- Restaurant Settings ---

export const getSettings = async (restaurantId: number): Promise<Restaurant | null> => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .single();
    
    if(error) {
        console.error("Error fetching settings:", error);
        return null;
    }
    
    return data as Restaurant | null;
}


export const updateSettings = async (restaurantId: number, settings: Partial<Restaurant>): Promise<Restaurant | null> => {
    const { id, ...updateData } = settings;
    
    const cleanedUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, v]) => v !== undefined && v !== null)
    );

    if (Object.keys(cleanedUpdateData).length === 0) {
        // No actual data to update, return current settings
        return getSettings(restaurantId);
    }


    const { data, error } = await supabase
        .from('restaurants')
        .update(cleanedUpdateData)
        .eq('id', restaurantId)
        .select()
        .single();
    
    if (error) {
        console.error("Error updating settings:", error);
        return null;
    }
    
    return data as Restaurant | null;
}
