import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dumbbell, Plus, Flame, Zap, Activity } from 'lucide-react';

export default function FitnessPage() {
  // Mock data - will be replaced with real data later
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  const recentWorkouts = [
    { id: 1, name: 'Morning Run', duration: '30 min', calories: 320, date: 'Today' },
    { id: 2, name: 'Evening Yoga', duration: '45 min', calories: 180, date: 'Yesterday' },
    { id: 3, name: 'HIIT Workout', duration: '25 min', calories: 280, date: '2 days ago' },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Fitness Tracker</h1>
        <p className="text-muted-foreground">
          {today} • Track your workouts and stay active
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Activity" 
          value="25 min" 
          description="Active time"
          icon={<Activity className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Calories Burned" 
          value="420 kcal" 
          description="Today's total"
          icon={<Flame className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Workouts" 
          value="3/5" 
          description="This week"
          icon={<Dumbbell className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Weekly Goal" 
          value="68%" 
          description="On track"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Log Workout</CardTitle>
                <CardDescription>Add your latest workout session</CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Workout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Workout Type</label>
                  <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="running">Running</option>
                    <option value="walking">Walking</option>
                    <option value="cycling">Cycling</option>
                    <option value="swimming">Swimming</option>
                    <option value="yoga">Yoga</option>
                    <option value="hiit">HIIT</option>
                    <option value="strength">Strength Training</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Duration (min)</label>
                  <input 
                    type="number" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="How did it go?"
                />
              </div>
              <Button className="w-full">Save Workout</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Workouts</CardTitle>
            <CardDescription>Your latest activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentWorkouts.map((workout) => (
                <div key={workout.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="space-y-1">
                    <p className="font-medium">{workout.name}</p>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <span>{workout.duration}</span>
                      <span className="mx-2">•</span>
                      <span>{workout.calories} cal</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">{workout.date}</span>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-primary">
                View All Workouts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}

function StatCard({ title, value, description, icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium">{title}</p>
        <div className="h-4 w-4 text-muted-foreground">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}
