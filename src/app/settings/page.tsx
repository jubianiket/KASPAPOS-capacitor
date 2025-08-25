
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { RestaurantSettings } from '@/types';
import { getSettings, updateSettings } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';

const settingsSchema = z.object({
  restaurant_name: z.string().min(1, 'Restaurant name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  tax_enabled: z.boolean().default(true),
  tax_id: z.string().optional(),
  dark_mode: z.boolean().default(false),
  theme_color: z.string().optional(),
  is_bar: z.boolean().default(false),
  is_restaurant: z.boolean().default(false),
  vat: z.coerce.number().min(0).optional(),
  igst: z.coerce.number().min(0).optional(),
  cgst: z.coerce.number().min(0).optional(),
  table_count: z.coerce.number().min(1, 'There must be at least one table.').max(100).optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isDirty, isSubmitting, errors },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      restaurant_name: '',
      address: '',
      phone: '',
      tax_enabled: true,
      tax_id: '',
      dark_mode: false,
      theme_color: '',
      is_bar: false,
      is_restaurant: false,
      vat: 0,
      igst: 0,
      cgst: 0,
      table_count: 12,
    }
  });

  const taxEnabled = watch('tax_enabled');
  const isBar = watch('is_bar');
  const isRestaurant = watch('is_restaurant');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.replace('/login');
    } else {
      const fetchSettings = async () => {
        setIsLoading(true);
        const fetchedSettings = await getSettings();
        if (fetchedSettings) {
          setSettings(fetchedSettings);
          reset({
            ...fetchedSettings,
            table_count: fetchedSettings.table_count || 12, // Ensure default if not set
          });
        }
        setIsLoading(false);
      };
      fetchSettings();
    }
  }, [router, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    const settingsToSave: RestaurantSettings = {
      ...(settings || { id: 1 }), // Always use id: 1
      ...data,
    };
    
    const updated = await updateSettings(settingsToSave);
    if (updated) {
      setSettings(updated);
      reset(updated); // Re-sync form with new data
      toast({ title: 'Success', description: 'Settings saved successfully.' });
      // Optional: force a reload to apply theme changes
      window.location.reload();
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
    }
  };
  
   useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      if (name === 'dark_mode') {
        document.documentElement.classList.toggle('dark', !!value.dark_mode);
      }
    });
    return () => subscription.unsubscribe();
  }, [watch]);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Configuration</CardTitle>
            <CardDescription>Manage your restaurant's details and operational parameters.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Controller
              name="restaurant_name"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="restaurant_name">Restaurant Name</Label>
                  <Input id="restaurant_name" {...field} />
                  {errors.restaurant_name && <p className="text-sm text-destructive">{errors.restaurant_name.message}</p>}
                </div>
              )}
            />
             <Controller
              name="address"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input id="address" {...field} value={field.value || ''} />
                </div>
              )}
            />
             <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" {...field} value={field.value || ''} />
                </div>
              )}
            />
             <Controller
              name="table_count"
              control={control}
              render={({ field }) => (
                <div className="space-y-2">
                  <Label htmlFor="table_count">Number of Tables</Label>
                  <Input id="table_count" type="number" {...field} value={field.value || ''} />
                  {errors.table_count && <p className="text-sm text-destructive">{errors.table_count.message}</p>}
                   <p className="text-xs text-muted-foreground">
                        Set the total number of tables available in your restaurant.
                   </p>
                </div>
              )}
            />
            
            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Type</h3>
              <div className="flex items-center gap-8">
                <Controller
                  name="is_restaurant"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is_restaurant" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="is_restaurant">Restaurant</Label>
                    </div>
                  )}
                />
                <Controller
                  name="is_bar"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is_bar" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="is_bar">Bar</Label>
                    </div>
                  )}
                />
              </div>
            </div>

            <Separator />
            
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Tax Settings</h3>
                 <Controller
                  name="tax_enabled"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                        <Switch id="tax_enabled" checked={field.value} onCheckedChange={field.onChange} />
                        <Label htmlFor="tax_enabled">Enable Tax Calculations</Label>
                    </div>
                  )}
                />
                {taxEnabled && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Controller
                            name="tax_id"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                <Label htmlFor="tax_id">Tax ID (e.g., GSTIN)</Label>
                                <Input id="tax_id" {...field} value={field.value || ''} />
                                </div>
                            )}
                            />
                        </div>

                        {isRestaurant && (
                             <div className="grid grid-cols-2 gap-4">
                                <Controller
                                name="cgst"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-2">
                                    <Label htmlFor="cgst">CGST (%)</Label>
                                    <Input id="cgst" type="number" step="0.01" {...field} value={field.value || ''} />
                                    </div>
                                )}
                                />
                                <Controller
                                name="igst"
                                control={control}
                                render={({ field }) => (
                                    <div className="space-y-2">
                                    <Label htmlFor="igst">IGST (%)</Label>
                                    <Input id="igst" type="number" step="0.01" {...field} value={field.value || ''} />
                                    </div>
                                )}
                                />
                            </div>
                        )}
                        {isBar && (
                            <Controller
                            name="vat"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                <Label htmlFor="vat">VAT (%)</Label>
                                <Input id="vat" type="number" step="0.01" {...field} value={field.value || ''} />
                                </div>
                            )}
                            />
                        )}
                    </div>
                )}
            </div>

            <Separator />
            
             <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>
                 <Controller
                  name="dark_mode"
                  control={control}
                  render={({ field }) => (
                    <div className="flex items-center space-x-2">
                       <Switch id="dark_mode" checked={field.value} onCheckedChange={field.onChange} />
                       <Label htmlFor="dark_mode">Enable Dark Mode</Label>
                    </div>
                  )}
                />
                 <Controller
                  name="theme_color"
                  control={control}
                  render={({ field }) => (
                    <div className="space-y-2">
                      <Label htmlFor="theme_color">Theme Color (HSL)</Label>
                      <Input id="theme_color" {...field} value={field.value || ''} placeholder="e.g., 240 5.9% 10%"/>
                       <p className="text-xs text-muted-foreground">
                        Enter a HSL color value for the primary theme color. Find values using an online color picker.
                      </p>
                    </div>
                  )}
                />
             </div>

          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={!isDirty || isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Settings'}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}

const SettingsSkeleton = () => (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
      <Skeleton className="h-9 w-48 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-full mt-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-28" />
          </CardFooter>
        </Card>
    </div>
);
