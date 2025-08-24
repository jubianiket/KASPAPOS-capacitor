
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
