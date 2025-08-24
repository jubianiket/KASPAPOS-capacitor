export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url?: string;
  created_at?: string;
}

export interface OrderItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  created_at: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method?: 'Cash' | 'Card' | 'Mobile';
  order_type: 'Dine In' | 'Delivery';
  table_number?: string;
  status: 'pending' | 'confirmed' | 'completed';
}
