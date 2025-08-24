
export interface MenuItem {
  id: number;
  name: string;
  rate: number;
  category: string;
  available?: boolean;
  portion?: string;
  is_active?: boolean;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: number; // Temporarily negative for client-side orders
  created_at: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method?: 'Cash' | 'Card' | 'Mobile';
  payment_status?: 'paid' | 'unpaid';
  order_type: 'dine-in' | 'delivery' | 'takeaway';
  table_number?: number | null;
  status: 'pending' | 'received' | 'completed';
  phone_no?: string;
  flat_no?: string;
  building_no?: string;
  address?: string;
}

export interface KitchenOrder {
  id: number;
  order_id: number;
  created_at: string;
  items: OrderItem[];
  order_type: 'dine-in' | 'delivery' | 'takeaway';
  table_number?: number | null;
  status: 'preparing' | 'ready';
}

export interface User {
    id: number;
    username: string;
    password?: string; // Optional for safety on client-side
    role: string;
    name: string;
    phone: number;
    email: string;
}

export interface RestaurantSettings {
    id: number;
    restaurant_name: string;
    address?: string | null;
    phone?: string | null;
    tax_enabled?: boolean;
    tax_rate?: number;
    tax_id?: string | null;
    dark_mode?: boolean;
    theme_color?: string | null;
}
