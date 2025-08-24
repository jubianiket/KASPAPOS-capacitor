
'use client';

import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { RestaurantSettings, User } from '@/types';
import { getSettings, updateSettings } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';

const settingsSchema = z.object({
  is_bar: z.boolean().default(false),
  is_restaurant: z.boolean().default(false),
  vat_rate: z.coerce.number().min(0).optional(),
  igst_rate: z.coerce.number().min(0).optional(),
  cgst_rate: z.coerce.number().min(0).optional(),
  table_count: z.coerce.number().int().min(1).max(100),
  phone_number: z.string().min(1, 'Phone number is required'),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function SettingsPage() {
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isDirty, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const isBar = watch('is_bar');
  const isRestaurant = watch('is_restaurant');

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      router.replace('/login');
    } else {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      const fetchSettings = async () => {
        setIsLoading(true);
        const fetchedSettings = await getSettings(parsedUser.id);
        if (fetchedSettings) {
          setSettings(fetchedSettings);
          reset(fetchedSettings);
        }
        setIsLoading(false);
      };
      fetchSettings();
    }
  }, [router, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    const settingsToSave: RestaurantSettings = {
      ...(settings || { id: -1, user_id: user.id }),
      ...data,
      vat_rate: data.is_bar ? data.vat_rate : 0,
      igst_rate: data.is_restaurant ? data.igst_rate : 0,
      cgst_rate: data.is_restaurant ? data.cgst_rate : 0,
    };
    const updated = await updateSettings(settingsToSave);
    if (updated) {
      setSettings(updated);
      reset(updated); // Re-sync form with new data
      toast({ title: 'Success', description: 'Settings saved successfully.' });
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
    }
  };

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
            <div className="space-y-2">
              <Label>Restaurant Type</Label>
              <div className="flex gap-4 items-center">
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

            {isRestaurant && (
              <div className="grid grid-cols-2 gap-4">
                <Controller
                  name="cgst_rate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="cgst_rate">CGST Rate (%)</Label>
                      <Input id="cgst_rate" type="number" step="0.01" {...field} value={field.value || ''} />
                      {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
                <Controller
                  name="igst_rate"
                  control={control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <Label htmlFor="igst_rate">IGST Rate (%)</Label>
                      <Input id="igst_rate" type="number" step="0.01" {...field} value={field.value || ''} />
                      {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                    </div>
                  )}
                />
              </div>
            )}

            {isBar && (
              <Controller
                name="vat_rate"
                control={control}
                render={({ field, fieldState }) => (
                  <div className="space-y-2">
                    <Label htmlFor="vat_rate">VAT Rate (%)</Label>
                    <Input id="vat_rate" type="number" step="0.01" {...field} value={field.value || ''} />
                    {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
            )}
            
            <hr/>
            
            <Controller
              name="table_count"
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="table_count">Number of Tables</Label>
                  <Input id="table_count" type="number" {...field} value={field.value || ''} />
                  {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </div>
              )}
            />

            <Controller
              name="phone_number"
              control={control}
              render={({ field, fieldState }) => (
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Restaurant Phone</Label>
                  <Input id="phone_number" type="tel" {...field} value={field.value || ''}/>
                   {fieldState.error && <p className="text-sm text-destructive">{fieldState.error.message}</p>}
                </div>
              )}
            />
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
