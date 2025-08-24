
"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"
import type { Order } from "@/types";
import { useMemo } from "react";

interface SalesChartProps {
    orders: Order[];
}

export function SalesChart({ orders }: SalesChartProps) {
    const data = useMemo(() => {
        const salesByDay: { [key: string]: number } = {};
        
        orders.forEach(order => {
            const date = new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            if (salesByDay[date]) {
                salesByDay[date] += order.total;
            } else {
                salesByDay[date] = order.total;
            }
        });

        // Get last 7 days for display
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
             const d = new Date();
             d.setDate(d.getDate() - i);
             return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }).reverse();
        
        return last7Days.map(day => ({
            name: day,
            total: salesByDay[day] || 0,
        }));
        
    }, [orders]);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `Rs.${value}`}
        />
         <Tooltip 
            cursor={{fill: 'hsl(var(--muted))'}}
            contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
            }}
         />
        <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
