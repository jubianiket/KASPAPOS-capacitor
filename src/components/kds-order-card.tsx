
'use client';

import { useEffect, useState } from 'react';
import type { KitchenOrder } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Utensils, Bike, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

interface KdsOrderCardProps {
  order: KitchenOrder;
  onUpdateStatus: (orderId: number, status: 'preparing' | 'ready') => void;
}

const useTimeElapsed = (startTime: string) => {
    const [elapsed, setElapsed] = useState('');

    useEffect(() => {
        const interval = setInterval(() => {
            const start = new Date(startTime).getTime();
            const now = new Date().getTime();
            const difference = now - start;

            const minutes = Math.floor(difference / 60000);
            const seconds = Math.floor((difference % 60000) / 1000);

            setElapsed(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    return elapsed;
};

export default function KdsOrderCard({ order, onUpdateStatus }: KdsOrderCardProps) {
    const timeElapsed = useTimeElapsed(order.created_at);
    const cardBorderColor = order.status === 'ready' ? 'border-green-500' : 'border-transparent';
    const isReady = order.status === 'ready';

    return (
        <Card className={cn("flex flex-col h-full shadow-md transition-all", cardBorderColor, isReady && 'opacity-50')}>
            <CardHeader className="bg-card-foreground text-background p-4 rounded-t-lg">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg flex items-center gap-2">
                        {order.order_type === 'dine-in' ? <Utensils /> : <Bike />}
                        {order.order_type === 'dine-in' ? `Table ${order.table_number}` : `Delivery #${order.order_id.toString().slice(-4)}`}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm font-mono">
                        <Clock className="h-4 w-4"/>
                        <span>{timeElapsed}</span>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow">
                 <ScrollArea className="h-64 pr-3">
                    <ul className="space-y-3">
                        {order.items.map((item, index) => (
                        <li key={`${item.id}-${index}`} className="flex justify-between items-center gap-2">
                            <span className="font-semibold text-lg">{item.quantity}</span>
                             <p className="flex-grow text-sm">
                                {item.name}
                                {item.portion && item.portion !== "Regular" && (
                                     <span className="text-xs text-muted-foreground ml-2">({item.portion})</span>
                                )}
                            </p>
                        </li>
                        ))}
                    </ul>
                 </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
                <Button 
                    className="w-full text-base py-5" 
                    onClick={() => onUpdateStatus(order.id, 'ready')}
                    disabled={isReady}
                    variant={isReady ? 'secondary' : 'default'}
                >
                    <CheckCircle className="mr-2" />
                    {isReady ? 'Completed' : 'Mark as Ready'}
                </Button>
            </CardFooter>
        </Card>
    );
}
