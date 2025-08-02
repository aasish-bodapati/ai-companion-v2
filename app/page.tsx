"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import Image from "next/image";

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // Redirect to dashboard if user is already logged in
  useEffect(() => {
    if (isLoading) return; // Don't do anything while still loading
    
    if (user) {
      console.log('[Home] User is logged in, redirecting to dashboard');
      router.push('/dashboard');
    } else {
      console.log('[Home] No user found, showing landing page');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your session...</p>
          <p className="text-sm text-muted-foreground">If this takes too long, try refreshing the page</p>
        </div>
      </div>
    );
  }

  // Features data
  const features = [
    {
      title: 'AI-Powered Journaling',
      description: 'Reflect on your day with AI that understands your emotions and provides meaningful insights.'
    },
    {
      title: 'Fitness Tracking',
      description: 'Log your workouts, track progress, and get personalized recommendations.'
    },
    {
      title: 'Water Intake',
      description: 'Stay hydrated with daily water intake tracking and reminders.'
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 sm:py-24 lg:py-32">
        <div className="container max-w-4xl mx-auto text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Welcome to Your AI Companion
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Track your fitness, journal your thoughts, and grow with AI-powered insights.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/login')}
              className="px-8 py-6 text-base font-medium"
            >
              Sign In
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => router.push('/signup')}
              className="px-8 py-6 text-base font-medium"
            >
              Create Account
            </Button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Features</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-background p-6 rounded-lg shadow-sm border">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground">
          <p> {new Date().getFullYear()} AI Companion. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
