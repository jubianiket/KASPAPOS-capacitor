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
  id: number;
  created_at: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method?: 'Cash' | 'Card' | 'Mobile';
  order_type: 'Dine In' | 'Delivery' | 'dine-in' | 'delivery';
  table_number?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'received' | 'preparing' | 'ready';
}

    