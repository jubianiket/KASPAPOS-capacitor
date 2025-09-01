

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
    return (data || []).map(item => ({ ...item, rate: Number(item.rate), restaurant_id: restaurantId })) as MenuItem[];
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

export const signUp = async (email: string, password: string, userData: Omit<User, 'id' | 'role' | 'restaurant_id' | 'email'>): Promise<User | null> => {
    // 1. Check if user already exists by email or username
    const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .or(`email.eq.${email},username.eq.${userData.username}`)
        .maybeSingle();

    if (existingUserError && existingUserError.code !== 'PGRST116') { // PGRST116 means no rows found, which is OK
        console.error("Error checking for existing user:", existingUserError);
        return null;
    }
    
    if (existingUser) {
        // This is a normal condition, not an error, so we don't log it. The UI will handle the message.
        return null;
    }

    // 2. Create a new restaurant for the user
    const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .insert({ restaurant_name: `${userData.name}'s Restaurant` })
        .select('id')
        .single();

    if (restaurantError || !restaurantData) {
        console.error("Error creating restaurant:", restaurantError);
        return null;
    }

    // 3. Create the new user with the restaurant_id
    const userToCreate = {
        ...userData,
        email,
        password, // Storing plain text password as requested
        role: 'admin',
        restaurant_id: restaurantData.id,
    };

    const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert(userToCreate)
        .select()
        .single();

    if (userError || !newUser) {
        console.error("Error creating user:", userError);
        // Attempt to clean up the created restaurant if user creation fails
        await supabase.from('restaurants').delete().eq('id', restaurantData.id);
        return null;
    }
    
    return newUser as User;
};


export const signIn = async (identifier: string, password: string): Promise<User | null> => {
    const isNumeric = !isNaN(Number(identifier));
    
    let orConditions = `email.eq.${identifier},username.eq.${identifier}`;
    if(isNumeric){
      orConditions += `,phone.eq.${Number(identifier)}`;
    }

    const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .or(orConditions)
        .single();

    // The specific error code for zero rows from a .single() query is 'PGRST116'.
    // We only want to log an error if it's something other than 'user not found'.
    if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user:", error);
        return null;
    }
    
    if (!user) {
        return null; // User not found
    }

    if (user.password !== password) {
        return null; // Password mismatch
    }

    const { data: latestUser, error: latestUserError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
    
    if(latestUserError || !latestUser) {
        console.error('Could not re-fetch user after sign-in', latestUserError);
        return null;
    }
    
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = latestUser;
    return userWithoutPassword as User;
};


// --- Restaurant Settings ---

export const getSettings = async (restaurantId: number): Promise<Restaurant | null> => {
    const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', restaurantId)
        .maybeSingle(); // Use maybeSingle to prevent error when no settings exist
    
    if(error) {
        console.error("[getSettings] Error fetching settings:", error);
        return null;
    }
    
    return data as Restaurant | null;
}


export const updateSettings = async (restaurantId: number, settings: Partial<Restaurant>): Promise<Restaurant | null> => {
    const settingsToUpdate = { ...settings };
    // The 'id' field should never be part of the update payload.
    delete settingsToUpdate.id;

    const { data, error } = await supabase
        .from('restaurants')
        .update(settingsToUpdate)
        .eq('id', restaurantId)
        .select()
        .single();
    
    if (error) {
        console.error("[updateSettings] Error from Supabase:", error);
        return null;
    }
    
    return data as Restaurant | null;
}
