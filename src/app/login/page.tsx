
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { signIn } from '@/lib/supabase';
import Link from 'next/link';
import AuthHeader from '@/components/auth-header';
import { Skeleton } from '@/components/ui/skeleton';

function LoginPageSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <AuthHeader />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-4 w-4/5" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-4 w-3/5" />
                </CardFooter>
            </Card>
        </div>
    );
}

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    const router = useRouter();
    const { toast } = useToast();
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const user = await signIn(email, password);

        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            toast({
                title: 'Login Successful',
                description: `Welcome back, ${user.name}!`,
            });
            router.push('/');
        } else {
            toast({
                variant: 'destructive',
                title: 'Login Failed',
                description: 'Invalid credentials. Please check your email and password.',
            });
        }
        setIsLoading(false);
    };

    if (!isClient) {
        return <LoginPageSkeleton />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <AuthHeader />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>Enter your email to access your account.</CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading ? 'Signing In...' : 'Sign In'}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                            Don&apos;t have an account?{' '}
                            <Link href="/signup" className="underline hover:text-primary">
                                Sign up
                            </Link>
                        </p>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
