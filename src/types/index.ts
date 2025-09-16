

export interface MenuItem {
  id: number;
  name: string;
  rate: number;
  category: string;
  portion?: string;
  is_active?: boolean;
  restaurant_id: number;
  dietary_type?: 'Veg' | 'Non Veg';
}

export interface GroupedMenuItem {
  name: string;
  category: string;
  baseRate: number;
  portions: MenuItem[];
  dietary_type?: 'Veg' | 'Non Veg';
}

export interface OrderItem extends MenuItem {
  quantity: number;
  portion?: string; // Add portion to OrderItem
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
  status: 'pending' | 'received' | 'ready' | 'completed';
  phone_no?: string;
  flat_no?: string;
  building_no?: string;
  address?: string;
  restaurant_id: number;
}

export interface KitchenOrder {
  id: number;
  order_id: number;
  created_at: string;
  items: OrderItem[];
  order_type: 'dine-in' | 'delivery' | 'takeaway';
  table_number?: number | null;
  status: 'preparing' | 'ready';
  restaurant_id: number;
}

export interface User {
    id: number; 
    username: string;
    role: string;
    name: string;
    phone: number;
    email: string;
    restaurant_id: number;
    restaurant_name?: string; // Add restaurant name
    password?: string;
}

export interface Restaurant {
    id: number;
    restaurant_name: string;
    address?: string | null;
    phone?: string | null;
    tax_enabled?: boolean;
    tax_id?: string | null;
    dark_mode?: boolean;
    theme_color?: string | null;
    is_bar?: boolean;
    is_restaurant?: boolean;
    vat?: number;
    igst?: number;
    cgst?: number;
    table_count?: number;
    qr_code_url?: string | null;
    kds_enabled?: boolean;
}
