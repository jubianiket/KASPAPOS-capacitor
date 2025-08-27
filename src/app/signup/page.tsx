
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signUp } from '@/lib/supabase';
import type { User } from '@/types';
import Link from 'next/link';
import AuthHeader from '@/components/auth-header';
import { Skeleton } from '@/components/ui/skeleton';

function SignupPageSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <AuthHeader />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-4/5" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                    <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-3/5" />
                </CardFooter>
            </Card>
        </div>
    );
}

export default function SignupPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        name: '',
        phone: '',
        email: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const phoneAsNumber = Number(formData.phone);
        if (isNaN(phoneAsNumber) || formData.phone.trim() === '') {
            toast({
                variant: 'destructive',
                title: 'Invalid Phone Number',
                description: 'Please enter a valid phone number.',
            });
            setIsLoading(false);
            return;
        }

        const userData = {
            name: formData.name,
            username: formData.username,
            phone: phoneAsNumber,
        };

        const user = await signUp(formData.email, formData.password, userData);

        if (user) {
            toast({
                title: 'Signup Successful',
                description: 'Your account has been created. Please log in.',
            });
            router.push('/login');
        } else {
            toast({
                variant: 'destructive',
                title: 'Signup Failed',
                description: 'Could not create your account. This email or username may already be taken.',
            });
        }
        setIsLoading(false);
    };
    
    if (!isClient) {
        return <SignupPageSkeleton />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <AuthHeader />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Sign Up</CardTitle>
                    <CardDescription>Create a new account to get started.</CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input id="name" name="name" autoComplete="name" value={formData.name} onChange={handleChange} required />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input id="phone" name="phone" type="tel" autoComplete="tel" pattern="[0-9]*" value={formData.phone} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" autoComplete="email" value={formData.email} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input id="username" name="username" autoComplete="username" value={formData.username} onChange={handleChange} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" autoComplete="new-password" value={formData.password} onChange={handleChange} required />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Creating Account...' : 'Create Account'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Already have an account?{' '}
                            <Link href="/login" className="underline hover:text-primary">
                                Login
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
