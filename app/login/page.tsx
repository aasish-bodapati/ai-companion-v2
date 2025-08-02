'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn, isLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    console.log('[Login] Form submitted', { email: data.email });
    setIsSubmitting(true);
    
    try {
      console.log('[Login] Calling signIn...');
      const session = await signIn(data.email, data.password);
      
      if (!session) {
        console.error('[Login] No session returned from signIn');
        throw new Error('Authentication failed. Please try again.');
      }
      
      console.log('[Login] Sign in successful, got session:', {
        user: session.user?.email,
        expiresAt: session.expires_at
      });
      
      // Show success message
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
      
      // The auth state change handler in AuthProvider will handle the redirect
      
    } catch (error) {
      console.error('[Login] Error during sign in:', error);
      
      let errorMessage = 'Failed to sign in. Please try again.';
      let showRetry = true;
      
      if (error instanceof Error) {
        // Handle specific Supabase auth errors
        const errorName = error.name || '';
        const errorStatus = (error as any).status;
        
        if (errorStatus === 400 || errorName.includes('AuthInvalidCredentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials.';
        } else if (errorStatus === 429 || errorName.includes('TooManyRequests')) {
          errorMessage = 'Too many login attempts. Please try again later.';
          showRetry = false;
        } else if (errorStatus === 403 || errorName.includes('EmailNotConfirmed')) {
          errorMessage = 'Please verify your email address before signing in.';
        } else if (errorName.includes('AuthSessionMissingError')) {
          errorMessage = 'Session expired. Please sign in again.';
        } else if (errorName.includes('NetworkError')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else {
          // For other errors, use the error message if available
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        action: showRetry ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSubmit(data)}
            className="mt-2"
          >
            Try Again
          </Button>
        ) : undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                {...register('email')}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>
            
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium mb-1">
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => router.push('/forgot-password')}
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading || isSubmitting}
          >
            {isLoading || isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </Button>
        </form>
        
        <div className="text-center text-sm">
          Don't have an account?{' '}
          <button
            type="button"
            className="text-primary hover:underline"
            onClick={() => router.push('/signup')}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
}