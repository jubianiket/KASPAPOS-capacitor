
"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Order } from "@/types";
import { Bike, Utensils, Hash, ListOrdered, Phone, Home } from "lucide-react";

interface ActiveOrdersProps {
  orders: Order[];
  onSelectOrder: (orderId: number) => void;
  activeOrderId?: number | null;
}

export default function ActiveOrders({ orders, onSelectOrder, activeOrderId }: ActiveOrdersProps) {

  const getOrderTitle = (order: Order) => {
    if (order.order_type === 'delivery') {
      return `Delivery #${order.id.toString().slice(-4)}`;
    }
    return `Table ${order.table_number}`;
  }
  
  if (orders.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <ListOrdered className="w-5 h-5" /> Active Orders
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {orders.map((order) => {
          const isSelected = activeOrderId === order.id;
          const isReady = order.status === 'ready';

          return (
            <Card
              key={order.id}
              onClick={() => onSelectOrder(order.id)}
              className={cn(
                "cursor-pointer transition-all duration-200 flex flex-col relative",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2"
                  : isReady
                  ? "bg-amber-500/20 border-amber-500 text-amber-700"
                  : "hover:bg-muted/50"
              )}
            >
              {isReady && (
                 <span className="absolute -top-2 -right-2 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500"></span>
                </span>
              )}
              <CardContent className="p-3 flex flex-col justify-between h-full">
                <div>
                    <div className="flex items-center justify-between mb-2">
                       <p className="font-bold">{getOrderTitle(order)}</p>
                       {order.order_type === 'dine-in'
                            ? <Utensils className="w-4 h-4 text-muted-foreground" /> 
                            : <Bike className="w-4 h-4 text-muted-foreground" />
                        }
                    </div>
                    {order.order_type === 'delivery' && (order.phone_no || order.flat_no) && (
                        <div className="text-xs space-y-1 mb-2">
                            {order.phone_no && (
                                <div className="flex items-center gap-2">
                                    <Phone className="w-3 h-3"/>
                                    <span>{order.phone_no}</span>
                                </div>
                            )}
                            {order.flat_no && (
                                <div className="flex items-center gap-2">
                                    <Home className="w-3 h-3"/>
                                    <span>{order.flat_no}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div>
                    <div className="text-sm space-y-1">
                        <div className="flex items-center gap-2">
                            <Hash className="w-3 h-3"/>
                            <span>{order.items.length} items</span>
                        </div>
                        <div className="font-semibold">
                           Rs.{order.total.toFixed(2)}
                        </div>
                    </div>
                     {order.status && <Badge variant={isReady ? 'destructive' : 'secondary'} className="capitalize mt-2">{order.status}</Badge>}
                 </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  );
}
