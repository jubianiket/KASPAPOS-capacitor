"use client";

import Image from 'next/image';
import { Plus } from 'lucide-react';
import type { MenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="p-0">
        <div className="aspect-video overflow-hidden">
          <Image
            src={item.imageUrl}
            alt={item.name}
            width={300}
            height={200}
            className="object-cover w-full h-full"
            data-ai-hint={`${item.category.toLowerCase()} ${item.name.split(' ')[1]?.toLowerCase() || ''}`}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-base font-semibold mb-1">{item.name}</CardTitle>
        <p className="text-sm text-muted-foreground">{item.description}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-bold text-primary">${item.price.toFixed(2)}</p>
        <Button size="icon" variant="outline" onClick={() => onAddToOrder(item)} aria-label={`Add ${item.name} to order`}>
          <Plus className="h-5 w-5" />
        </Button>
      </CardFooter>
    </Card>
  );
}
