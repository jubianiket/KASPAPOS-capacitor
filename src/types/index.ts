
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
  id?: number; // ID is optional for new orders not yet saved
  created_at: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method?: 'Cash' | 'Card' | 'Mobile';
  payment_status?: 'paid' | 'unpaid';
  order_type: 'dine-in' | 'delivery' | 'takeaway';
  table_number?: number | null;
  status: 'received' | 'preparing' | 'ready' | 'completed';
}
