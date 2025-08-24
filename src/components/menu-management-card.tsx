
"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GroupedMenuItem, MenuItem } from "@/types";
import { Edit, PlusCircle, Trash2 } from "lucide-react";

interface MenuManagementCardProps {
    group: GroupedMenuItem;
    onEditItem: (item: MenuItem) => void;
    onDeleteItem: (item: MenuItem) => void;
    onAddNewPortion: (group: GroupedMenuItem) => void;
}

export default function MenuManagementCard({ group, onEditItem, onDeleteItem, onAddNewPortion }: MenuManagementCardProps) {
    return (
        <Card key={group.name} className="flex flex-col">
            <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>{group.category}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                <Separator />
                {group.portions.sort((a,b) => (a.portion || "").localeCompare(b.portion || "")).map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{item.portion || 'Regular'}</p>
                            <p className="text-sm text-muted-foreground">Rs.{item.rate.toFixed(2)}</p>
                            <div className="mt-1 flex gap-2">
                                <Badge variant={item.is_active ? "default" : "secondary"} className="text-xs">
                                    {item.is_active ? "Active" : "Inactive"}
                                </Badge>
                                <Badge variant={item.available ? "outline" : "secondary"} className={`text-xs ${item.available ? 'border-green-600 text-green-700' : ''}`}>
                                    {item.available ? "Available" : "Unavailable"}
                                </Badge>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditItem(item)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDeleteItem(item)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => onAddNewPortion(group)}>
                   <PlusCircle className="mr-2 h-4 w-4" /> Add Portion
                </Button>
            </CardFooter>
        </Card>
    )
}
