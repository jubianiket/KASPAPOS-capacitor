
"use client";

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import type { MenuItem } from '@/types';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Leaf, Drumstick } from 'lucide-react';

const menuItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z.coerce.number().min(0, 'Rate must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  portion: z.string().min(1, 'Portion is required'),
  is_active: z.boolean().default(true),
  dietary_type: z.enum(['Veg', 'Non Veg']).optional().nullable(),
});

type MenuItemFormData = z.infer<typeof menuItemSchema>;

interface MenuItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (data: MenuItemFormData) => void;
  item: MenuItem | null;
}

export default function MenuItemFormDialog({
  isOpen,
  onOpenChange,
  onSubmit,
  item,
}: MenuItemFormDialogProps) {
  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: '',
      rate: 0,
      category: '',
      portion: 'Regular',
      is_active: true,
      dietary_type: undefined,
    },
  });

  useEffect(() => {
    if (item) {
      reset(item);
    } else {
      reset({
        name: '',
        rate: 0,
        category: '',
        portion: 'Regular',
        is_active: true,
        dietary_type: undefined,
      });
    }
  }, [item, reset]);

  const dialogTitle = item ? 'Edit Menu Item' : 'Add New Menu Item';
  const dialogDescription = item
    ? 'Update the details for this menu item portion.'
    : 'Enter the details for the new menu item.';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
            <DialogDescription>{dialogDescription}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" {...field} />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
              )}
            />
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" {...field} />
                   {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
              )}
            />
             <div className="grid grid-cols-2 gap-4">
               <Controller
                name="portion"
                control={control}
                render={({ field }) => (
                    <div className="space-y-2">
                    <Label htmlFor="portion">Portion</Label>
                    <Input id="portion" {...field} />
                    {errors.portion && <p className="text-sm text-destructive">{errors.portion.message}</p>}
                    </div>
                )}
                />
                <Controller
                name="rate"
                control={control}
                render={({ field }) => (
                    <div className="space-y-2">
                    <Label htmlFor="rate">Rate</Label>
                    <Input id="rate" type="number" step="0.01" {...field} />
                    {errors.rate && <p className="text-sm text-destructive">{errors.rate.message}</p>}
                    </div>
                )}
                />
             </div>
             <div className="space-y-2">
                <Label>Dietary Type</Label>
                 <Controller
                    name="dietary_type"
                    control={control}
                    render={({ field }) => (
                        <ToggleGroup 
                            type="single"
                            variant="outline"
                            value={field.value ?? ""}
                            onValueChange={field.onChange}
                            className="justify-start"
                        >
                            <ToggleGroupItem value="Veg" aria-label="Set as veg"><Leaf className="h-4 w-4 mr-2 text-green-600"/>Veg</ToggleGroupItem>
                            <ToggleGroupItem value="Non Veg" aria-label="Set as non-veg"><Drumstick className="h-4 w-4 mr-2 text-red-600"/>Non-Veg</ToggleGroupItem>
                        </ToggleGroup>
                    )}
                 />
                 {errors.dietary_type && <p className="text-sm text-destructive">{errors.dietary_type.message}</p>}
             </div>
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2 pt-2">
                  <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                  <Label htmlFor="is_active">Item is Active</Label>
                </div>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
