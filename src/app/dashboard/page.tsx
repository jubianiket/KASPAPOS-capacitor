
"use client";

import { useEffect, useState, useMemo } from 'react';
import type { Order } from '@/types';
import { getCompletedOrders } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, BarChart, Users } from 'lucide-react';
import { SalesChart } from '@/components/dashboard/sales-chart';
import { PopularCategoriesChart } from '@/components/dashboard/popular-categories-chart';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOrders = async () => {
            setIsLoading(true);
            const completedOrders = await getCompletedOrders();
            setOrders(completedOrders);
            setIsLoading(false);
        };
        fetchOrders();
    }, []);

    const stats = useMemo(() => {
        const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0);
        const totalOrders = orders.length;
        const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        return {
            totalRevenue,
            totalOrders,
            averageOrderValue
        };
    }, [orders]);

    return (
        <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            {isLoading ? (
                <DashboardSkeleton />
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Rs.{stats.totalRevenue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">From {stats.totalOrders} orders</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">+{stats.totalOrders}</div>
                                <p className="text-xs text-muted-foreground">Across all time</p>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Average Order Value</CardTitle>
                                <BarChart className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">Rs.{stats.averageOrderValue.toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">Per transaction</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="lg:col-span-4">
                            <CardHeader>
                                <CardTitle>Sales Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <SalesChart orders={orders} />
                            </CardContent>
                        </Card>
                         <Card className="lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Popular Categories</CardTitle>
                            </CardHeader>
                            <CardContent>
                               <PopularCategoriesChart orders={orders} />
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
        </div>
    );
}

const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Skeleton className="lg:col-span-4 h-80" />
            <Skeleton className="lg:col-span-3 h-80" />
        </div>
    </div>
);
