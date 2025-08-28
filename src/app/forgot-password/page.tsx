
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import AuthHeader from '@/components/auth-header';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // In a real application, this would trigger a password reset email.
        // For this demo, we'll just show a confirmation message.
        console.log('Password reset requested for:', email);

        // Simulate network request
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        toast({
            title: 'Request Sent',
            description: 'If an account exists for this email, a reset link will be sent.',
        });
        
        setIsSubmitted(true);
        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
            <AuthHeader />
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                      {isSubmitted 
                        ? "Check your inbox for a password reset link."
                        : "Enter your email and we'll send you a link to reset your password."
                      }
                    </CardDescription>
                </CardHeader>
                {!isSubmitted ? (
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4">
                            <Button type="submit" className="w-full" disabled={isLoading}>
                                {isLoading ? 'Sending...' : 'Send Reset Link'}
                            </Button>
                        </CardFooter>
                    </form>
                ) : (
                    <CardContent>
                        <p className="text-sm text-center text-muted-foreground">
                            Didn't receive an email? Check your spam folder or try again.
                        </p>
                    </CardContent>
                )}
                 <CardFooter className="justify-center">
                    <Button variant="link" asChild>
                        <Link href="/login">Back to Login</Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
