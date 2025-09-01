
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import type { Restaurant, User } from '@/types';
import { getSettings, updateSettings } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter } from 'next/navigation';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import Image from 'next/image';

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<Partial<Restaurant>>({});
  const { toast } = useToast();
  const router = useRouter();

  const handleFieldChange = (field: keyof Restaurant, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleQrCodeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit
        toast({ variant: 'destructive', title: 'Error', description: 'File size should not exceed 1MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        handleFieldChange('qr_code_url', reader.result as string);
      };
      reader.onerror = () => {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to read the file.' });
      }
      reader.readAsDataURL(file);
    }
  }

  const fetchSettings = useCallback(async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.replace('/login');
      return;
    }
    const user = JSON.parse(userStr);
    if (!user?.restaurant_id) {
      setIsLoading(false);
      toast({ variant: 'destructive', title: 'Error', description: 'Could not find a restaurant associated with your account.' });
      return;
    }

    setIsLoading(true);
    const fetchedSettings = await getSettings(user.restaurant_id);
    if (fetchedSettings) {
      setSettings(fetchedSettings);
    }
    setIsLoading(false);
  }, [router, toast]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        toast({ variant: 'destructive', title: 'Error', description: 'You are not logged in.' });
        setIsSaving(false);
        return;
    }
    const currentUser = JSON.parse(userStr);

    if (!currentUser?.restaurant_id) {
       toast({ variant: 'destructive', title: 'Error', description: 'No restaurant associated with your account.' });
       setIsSaving(false);
       return;
    }

    const updated = await updateSettings(currentUser.restaurant_id, settings);
    
    if (updated) {
      toast({ title: 'Success', description: 'Settings saved successfully.' });
      await fetchSettings(); // Refresh settings from DB
    } else {
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save settings.' });
    }
    setIsSaving(false);
  };
  
   useEffect(() => {
      if (settings.dark_mode !== undefined) {
        document.documentElement.classList.toggle('dark', settings.dark_mode);
      }
      if (settings.theme_color) {
        document.documentElement.style.setProperty('--primary', settings.theme_color);
      }
  }, [settings.dark_mode, settings.theme_color]);

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Restaurant Configuration</CardTitle>
          <CardDescription>Manage your restaurant's details and operational parameters.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="restaurant_name">Restaurant Name</Label>
            <Input 
              id="restaurant_name" 
              name="restaurant_name"
              value={settings.restaurant_name || ''} 
              onChange={(e) => handleFieldChange('restaurant_name', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input 
              id="address" 
              name="address"
              value={settings.address || ''} 
              onChange={(e) => handleFieldChange('address', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              id="phone" 
              name="phone"
              type="tel" 
              value={settings.phone || ''} 
              onChange={(e) => handleFieldChange('phone', e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table_count">Number of Tables</Label>
            <Input 
              id="table_count" 
              name="table_count"
              type="number" 
              value={settings.table_count || ''} 
              onChange={(e) => handleFieldChange('table_count', parseInt(e.target.value, 10))} 
            />
            <p className="text-xs text-muted-foreground">
              Set the total number of tables available in your restaurant.
            </p>
          </div>
          
          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Business Type</h3>
            <div className="flex items-center gap-8">
              <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_restaurant" 
                    checked={!!settings.is_restaurant} 
                    onCheckedChange={(checked) => handleFieldChange('is_restaurant', checked)} 
                  />
                  <Label htmlFor="is_restaurant">Restaurant</Label>
              </div>
              <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="is_bar" 
                    checked={!!settings.is_bar} 
                    onCheckedChange={(checked) => handleFieldChange('is_bar', checked)} 
                  />
                  <Label htmlFor="is_bar">Bar</Label>
              </div>
            </div>
          </div>

          <Separator />
          
          <div className="space-y-4">
              <h3 className="text-lg font-medium">Tax Settings</h3>
              <div className="flex items-center space-x-2">
                  <Switch 
                    id="tax_enabled" 
                    checked={!!settings.tax_enabled} 
                    onCheckedChange={(checked) => handleFieldChange('tax_enabled', checked)} 
                  />
                  <Label htmlFor="tax_enabled">Enable Tax Calculations</Label>
              </div>
              {settings.tax_enabled && (
                  <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="tax_id">Tax ID (e.g., GSTIN)</Label>
                            <Input 
                              id="tax_id" 
                              name="tax_id"
                              value={settings.tax_id || ''} 
                              onChange={(e) => handleFieldChange('tax_id', e.target.value)} 
                            />
                          </div>
                      </div>

                      {settings.is_restaurant && (
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="cgst">CGST (%)</Label>
                                <Input 
                                  id="cgst" 
                                  name="cgst"
                                  type="number" 
                                  step="0.01" 
                                  value={settings.cgst || ''} 
                                  onChange={(e) => handleFieldChange('cgst', parseFloat(e.target.value))} 
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="igst">IGST (%)</Label>
                                <Input 
                                  id="igst" 
                                  name="igst"
                                  type="number" 
                                  step="0.01" 
                                  value={settings.igst || ''} 
                                  onChange={(e) => handleFieldChange('igst', parseFloat(e.target.value))} 
                                />
                              </div>
                          </div>
                      )}
                      {settings.is_bar && (
                          <div className="space-y-2">
                            <Label htmlFor="vat">VAT (%)</Label>
                            <Input 
                              id="vat" 
                              name="vat"
                              type="number" 
                              step="0.01" 
                              value={settings.vat || ''} 
                              onChange={(e) => handleFieldChange('vat', parseFloat(e.target.value))} 
                            />
                          </div>
                      )}
                  </div>
              )}
          </div>

          <Separator />
          
           <div className="space-y-4">
              <h3 className="text-lg font-medium">Appearance</h3>
               <div className="flex items-center space-x-2">
                 <Switch 
                    id="dark_mode" 
                    checked={!!settings.dark_mode} 
                    onCheckedChange={(checked) => handleFieldChange('dark_mode', checked)} 
                  />
                 <Label htmlFor="dark_mode">Enable Dark Mode</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="theme_color">Theme Color (HSL)</Label>
                <Input 
                  id="theme_color" 
                  name="theme_color"
                  value={settings.theme_color || ''} 
                  onChange={(e) => handleFieldChange('theme_color', e.target.value)} 
                  placeholder="e.g., 240 5.9% 10%"
                />
                 <p className="text-xs text-muted-foreground">
                  Enter a HSL color value for the primary theme color. Find values using an online color picker.
                </p>
              </div>
              <div className="space-y-4">
                <Label>Payment QR Code</Label>
                <div className="flex items-center gap-4">
                    {settings.qr_code_url && (
                        <div className="p-2 border rounded-md bg-muted">
                           <Image src={settings.qr_code_url} alt="Current QR Code" width={80} height={80} data-ai-hint="QR code"/>
                        </div>
                    )}
                    <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="qr-code-upload" className="text-sm font-normal text-muted-foreground">Upload new QR code</Label>
                        <Input id="qr-code-upload" type="file" accept="image/png, image/jpeg, image/svg+xml" onChange={handleQrCodeUpload} />
                    </div>
                </div>
                 <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                        Or
                        </span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="qr_code_url">Paste Image URL</Label>
                    <Input
                      id="qr_code_url"
                      name="qr_code_url"
                      value={settings.qr_code_url && !settings.qr_code_url.startsWith('data:') ? settings.qr_code_url : ''}
                      onChange={(e) => handleFieldChange('qr_code_url', e.target.value)}
                      placeholder="https://example.com/your-qr-code.png"
                    />
                    <p className="text-xs text-muted-foreground">
                      Paste the URL of your hosted UPI/Payment QR code image.
                    </p>
                </div>
              </div>
           </div>

        </CardContent>
        <CardFooter>
          <Button onClick={handleSave} disabled={isSaving || isLoading}>
            {isSaving ? 'Saving...' : 'Save Settings'}
          </Button>
        </CardFooter>
      </Card>
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
