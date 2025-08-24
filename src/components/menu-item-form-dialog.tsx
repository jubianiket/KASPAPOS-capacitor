
"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MenuItem } from "@/types";

interface MenuItemFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSubmit: (values: Partial<MenuItem>) => void;
  item: MenuItem | null;
}

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  rate: z.coerce.number().min(0, "Rate must be a positive number"),
  category: z.string().min(1, "Category is required"),
  portion: z.string().optional(),
  available: z.boolean().default(true),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

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
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      rate: 0,
      category: "",
      portion: "",
      available: true,
      is_active: true,
    },
  });

  useEffect(() => {
    if (item) {
      reset(item);
    } else {
      reset({
        name: "",
        rate: 0,
        category: "",
        portion: "",
        available: true,
        is_active: true,
      });
    }
  }, [item, reset, isOpen]);

  const handleFormSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{item ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
          <DialogDescription>
            Fill in the details below. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <Controller
            name="name"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input id="name" {...field} />
                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <Controller
            name="category"
            control={control}
            render={({ field, fieldState }) => (
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input id="category" {...field} />
                {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <div className="grid grid-cols-2 gap-4">
             <Controller
                name="rate"
                control={control}
                render={({ field, fieldState }) => (
                <div className="space-y-2">
                    <Label htmlFor="rate">Rate</Label>
                    <Input id="rate" type="number" step="0.01" {...field} />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </div>
                )}
            />
            <Controller
                name="portion"
                control={control}
                render={({ field, fieldState }) => (
                <div className="space-y-2">
                    <Label htmlFor="portion">Portion</Label>
                    <Input id="portion" {...field} value={field.value ?? ""} placeholder="e.g., Regular, Large" />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </div>
                )}
            />
          </div>
         <div className="flex items-center space-x-8 pt-4">
            <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center space-x-2">
                        <Switch id="is_active" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="is_active">Active</Label>
                    </div>
                )}
            />
            <Controller
                name="available"
                control={control}
                render={({ field }) => (
                    <div className="flex items-center space-x-2">
                        <Switch id="available" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="available">Available</Label>
                    </div>
                )}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
