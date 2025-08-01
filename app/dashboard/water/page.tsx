import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Droplets, Plus, GlassWater, Target, Zap } from 'lucide-react';

export default function WaterPage() {
  // Mock data - will be replaced with real data later
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const dailyGoal = 8; // 8 glasses per day
  const currentIntake = 5; // 5 glasses consumed today
  const percentage = Math.min(100, Math.round((currentIntake / dailyGoal) * 100));
  
  const recentLogs = [
    { id: 1, amount: 1, time: '8:30 AM' },
    { id: 2, amount: 1, time: '10:15 AM' },
    { id: 3, amount: 2, time: '12:45 PM' },
    { id: 4, amount: 1, time: '3:20 PM' },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Water Tracker</h1>
        <p className="text-muted-foreground">
          {today} • Stay hydrated throughout the day
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Intake" 
          value={`${currentIntake} glasses`} 
          description={`${dailyGoal - currentIntake} more to go`}
          icon={<GlassWater className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Daily Goal" 
          value={`${dailyGoal} glasses`} 
          description="8 glasses recommended"
          icon={<Target className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Hydration Level" 
          value={`${percentage}%`} 
          description="of daily goal"
          icon={<Droplets className="h-4 w-4 text-muted-foreground" />}
        />
        <StatCard 
          title="Streak" 
          value="7 days" 
          description="Keep it up!"
          icon={<Zap className="h-4 w-4 text-muted-foreground" />}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Log Water Intake</CardTitle>
            <CardDescription>Track your water consumption</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex justify-center space-x-4 py-4">
                {[1, 2, 3, 4].map((glasses) => (
                  <Button 
                    key={glasses} 
                    variant="outline" 
                    className="flex-col h-24 w-20 rounded-lg"
                    onClick={() => console.log(`Logging ${glasses} glass(es)`)}
                  >
                    <Droplets className="h-6 w-6 mb-1" />
                    <span>{glasses} glass{glasses > 1 ? 'es' : ''}</span>
                  </Button>
                ))}
                <Button 
                  variant="outline" 
                  className="flex-col h-24 w-20 rounded-lg"
                  onClick={() => console.log('Custom amount')}
                >
                  <Plus className="h-6 w-6 mb-1" />
                  <span>Custom</span>
                </Button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Notes (optional)</label>
                <textarea 
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Any notes about your water intake..."
                />
              </div>
              
              <Button className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Log Water Intake
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Today's Logs</CardTitle>
            <CardDescription>Your water intake today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentLogs.length > 0 ? (
                <>
                  {recentLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                      <div className="flex items-center space-x-3">
                        <Droplets className="h-4 w-4 text-primary" />
                        <span className="font-medium">{log.amount} glass{log.amount > 1 ? 'es' : ''}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{log.time}</span>
                    </div>
                  ))}
                  <div className="pt-2">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Daily Progress</span>
                      <span className="font-medium">{currentIntake} / {dailyGoal} glasses</span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No water logged today yet.</p>
                  <p className="text-sm">Stay hydrated by logging your first glass!</p>
                </div>
              )}
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
