'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { SmartFormContainer } from '@/components/ui/smart-form-container';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const success = await login(email, password);
      
      if (success) {
        setIsSuccess(true);
        
        // Clear form
        setEmail('');
        setPassword('');
        
        // AuthContext will handle the redirect to dashboard
        // No need to do additional redirect here
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      <SmartFormContainer
        title="Sign in to your account"
        description="Enter your credentials to access your health dashboard"
        onSubmit={handleSubmit}
        submitLabel="Sign in"
        loading={isLoading}
        disabled={isLoading}
        variant="auto"
        showSuccessMessage={isSuccess}
        successMessage="Login successful! Redirecting..."
        validationErrors={error ? { general: error } : {}}
        className="space-y-6"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="email-address">Email Address</Label>
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="password">Password</Label>
              <a href="#" className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
                Forgot password?
              </a>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex items-center mt-2">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <Label htmlFor="remember-me" className="ml-2">
                Remember me
              </Label>
            </div>
          </div>
        </div>
        
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or continue with
            </span>
          </div>
        </div>
        
        <div className="mt-6">
          <Button
            type="button"
            variant="outline"
            className="w-full"
          >
            <svg className="w-5 h-5 mr-2" aria-hidden="true" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
            </svg>
            Sign in with Google
          </Button>
        </div>

        <div className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors">
            Create an account
          </Link>
        </div>
      </SmartFormContainer>
    </div>
  );
}
