
"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"
import type { Order } from "@/types";
import { useMemo } from "react";

interface PopularCategoriesChartProps {
    orders: Order[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function PopularCategoriesChart({ orders }: PopularCategoriesChartProps) {
    const data = useMemo(() => {
        const categorySales: { [key: string]: number } = {};
        
        orders.forEach(order => {
            order.items.forEach(item => {
                const category = item.category || 'Uncategorized';
                if (categorySales[category]) {
                    categorySales[category] += item.rate * item.quantity;
                } else {
                    categorySales[category] = item.rate * item.quantity;
                }
            })
        });

        return Object.entries(categorySales).map(([name, value]) => ({
            name,
            value,
        })).sort((a,b) => b.value - a.value);

    }, [orders]);

    return (
        <ResponsiveContainer width="100%" height={350}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                        return (
                           (percent * 100) > 5 ?
                            <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                {`${(percent * 100).toFixed(0)}%`}
                            </text> : null
                        );
                    }}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    cursor={{fill: 'hsl(var(--muted))'}}
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                    }}
                    formatter={(value: number) => `Rs.${value.toFixed(2)}`}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}
