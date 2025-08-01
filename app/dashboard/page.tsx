import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Droplets, MessageSquare, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  // Mock data - will be replaced with real data later
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
        <p className="text-muted-foreground">
          {today} • Let's make today amazing! 🌟
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard 
          title="Daily Journal" 
          description="Reflect on your day" 
          icon={<MessageSquare className="h-4 w-4 text-muted-foreground" />}
          href="/chat"
          buttonText="Start Journaling"
        />
        <DashboardCard 
          title="Fitness" 
          description="Log your workout" 
          icon={<Dumbbell className="h-4 w-4 text-muted-foreground" />}
          href="/fitness"
          buttonText="Track Workout"
        />
        <DashboardCard 
          title="Water Intake" 
          description="Stay hydrated" 
          icon={<Droplets className="h-4 w-4 text-muted-foreground" />}
          href="/water"
          buttonText="Log Water"
        />
        <DashboardCard 
          title="Progress" 
          description="View your stats" 
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          href="/progress"
          buttonText="See Progress"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your recent interactions and progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ActivityItem 
                title="Morning Reflection"
                description="You journaled about your goals for the week"
                time="2 hours ago"
              />
              <ActivityItem 
                title="Workout Completed"
                description="You completed a 30-minute HIIT session"
                time="5 hours ago"
              />
              <ActivityItem 
                title="Water Intake"
                description="You've had 6 glasses of water today"
                time="3 hours ago"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Your daily progress at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatItem label="Journal Entries" value="3" max="7" />
              <StatItem label="Workout Minutes" value="45" max="60" />
              <StatItem label="Water Intake" value="1.5L" max="3L" />
              <StatItem label="Mood Average" value="4.2" max="5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  buttonText: string;
}

function DashboardCard({ title, description, icon, href, buttonText }: DashboardCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <Link href={href}>
          <Button size="sm" className="w-full">
            {buttonText}
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="h-2 w-2 mt-2 rounded-full bg-primary" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
    </div>
  );
}

interface StatItemProps {
  label: string;
  value: string | number;
  max: string | number;
}

function StatItem({ label, value, max }: StatItemProps) {
  const percentage = typeof value === 'number' && typeof max === 'number' 
    ? Math.min(100, (value / max) * 100) 
    : 0;
  
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value} / {max}</span>
      </div>
      <div className="h-2 bg-secondary rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full" 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
