'use client';

import { Dumbbell, Droplet, MessageSquare, Flame, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/auth/protected-route';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

// Time-based greeting
function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

type QuickActionButtonProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
  href: string;
};

function QuickActionButton({ icon: Icon, label, color, href }: QuickActionButtonProps) {
  return (
    <Link href={href}>
      <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-gray-100 hover:bg-gray-50 transition-colors h-full">
        <div className={`p-3 rounded-full ${color.split(' ')[0]} bg-opacity-20 mb-2`}>
          <Icon className={`h-5 w-5 ${color.split(' ')[1]}`} />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>
    </Link>
  );
}

function DashboardContent() {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  
  const greeting = getTimeGreeting();
  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: 'Signed out',
        description: 'You have been signed out successfully.',
      });
      router.push('/login');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out. Please try again.',
        variant: 'destructive',
      });
    }
  };
  
  // Only keep essential stats
  const stats = [
    { 
      label: 'Current Streak', 
      value: '7', 
      unit: 'days', 
      icon: Flame, 
      color: 'bg-orange-100',
      textColor: 'text-orange-600'
    },
    { 
      label: 'Water Intake', 
      value: '5', 
      unit: 'cups', 
      icon: Droplet, 
      color: 'bg-blue-100',
      textColor: 'text-blue-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}, {user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="text-gray-500">{today}</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleSignOut}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold">
                    {stat.value} <span className="text-sm font-normal text-gray-500">{stat.unit}</span>
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className={`h-5 w-5 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionButton 
          icon={MessageSquare} 
          label="Chat" 
          color="bg-blue-100 text-blue-600"
          href="/dashboard/chat" 
        />
        <QuickActionButton 
          icon={Dumbbell} 
          label="Fitness" 
          color="bg-purple-100 text-purple-600"
          href="/dashboard/fitness" 
        />
        <QuickActionButton 
          icon={Droplet} 
          label="Water" 
          color="bg-cyan-100 text-cyan-600"
          href="/dashboard/water" 
        />
        <QuickActionButton 
          icon={Flame} 
          label="Journal" 
          color="bg-orange-100 text-orange-600"
          href="/dashboard/journal" 
        />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
