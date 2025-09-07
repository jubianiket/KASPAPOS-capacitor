
"use client";

import { useState } from 'react';
import type { MenuItem, GroupedMenuItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreVertical, Edit, Trash2, Leaf, Drumstick } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface MenuManagementCardProps {
  item: GroupedMenuItem;
  onEdit: (portion: MenuItem) => void;
  onDelete: (portionId: number) => void;
}

const DietaryIcon = ({ type }: { type: 'Veg' | 'Non Veg' | string | undefined | null }) => {
  if (type === 'Veg') {
    return <Leaf className="h-4 w-4 text-green-600" />;
  }
  if (type === 'Non Veg') {
    return <Drumstick className="h-4 w-4 text-red-600" />;
  }
  return null;
}

export default function MenuManagementCard({ item, onEdit, onDelete }: MenuManagementCardProps) {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <CardTitle className="text-lg">{item.name}</CardTitle>
            <DietaryIcon type={item.dietary_type} />
        </div>
        <CardDescription>{item.category}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        {item.portions.map((portion, index) => (
            <div key={portion.id}>
                {index > 0 && <Separator className="mb-3" />}
                <div className="flex justify-between items-center">
                    <div>
                        <p className="font-semibold">{portion.portion}</p>
                        <p className="text-sm text-primary font-medium">Rs. {portion.rate.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={portion.is_active ? "secondary" : "outline"}>
                            {portion.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => onEdit(portion)}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(portion.id)} className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    <span>Delete</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}
