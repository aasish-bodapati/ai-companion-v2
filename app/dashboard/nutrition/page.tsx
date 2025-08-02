'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Utensils, Activity, BarChart2, Calendar, Clock } from 'lucide-react';

type Meal = {
  id: string;
  name: string;
  time: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type DailyNutrition = {
  date: string;
  meals: Meal[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
};

export default function NutritionPage() {
  const [activeTab, setActiveTab] = useState('today');
  const [showAddMeal, setShowAddMeal] = useState(false);
  
  // Mock data - replace with real data from your backend
  const [nutritionData, setNutritionData] = useState<DailyNutrition>({
    date: new Date().toISOString().split('T')[0],
    meals: [
      {
        id: '1',
        name: 'Scrambled Eggs with Avocado',
        time: '08:30',
        calories: 350,
        protein: 20,
        carbs: 12,
        fat: 25,
      },
      {
        id: '2',
        name: 'Grilled Chicken Salad',
        time: '13:00',
        calories: 450,
        protein: 35,
        carbs: 20,
        fat: 18,
      },
    ],
    totalCalories: 800,
    totalProtein: 55,
    totalCarbs: 32,
    totalFat: 43,
  });

  const handleAddMeal = (meal: Omit<Meal, 'id'>) => {
    // In a real app, you would save this to your backend
    const newMeal = {
      ...meal,
      id: Date.now().toString(),
    };
    
    setNutritionData(prev => ({
      ...prev,
      meals: [...prev.meals, newMeal],
      totalCalories: prev.totalCalories + meal.calories,
      totalProtein: prev.totalProtein + meal.protein,
      totalCarbs: prev.totalCarbs + meal.carbs,
      totalFat: prev.totalFat + meal.fat,
    }));
    
    setShowAddMeal(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Nutrition</h2>
          <p className="text-muted-foreground">Track your daily food intake and nutrition</p>
        </div>
        <Button onClick={() => setShowAddMeal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>

      <Tabs defaultValue="today" className="space-y-4">
        <TabsList>
          <TabsTrigger value="today" onClick={() => setActiveTab('today')}>
            Today
          </TabsTrigger>
          <TabsTrigger value="history" onClick={() => setActiveTab('history')}>
            History
          </TabsTrigger>
          <TabsTrigger value="analytics" onClick={() => setActiveTab('analytics')}>
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Calories</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.totalCalories}</div>
                <p className="text-xs text-muted-foreground">/ 2000 kcal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protein</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.totalProtein}g</div>
                <p className="text-xs text-muted-foreground">/ 150g goal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Carbs</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.totalCarbs}g</div>
                <p className="text-xs text-muted-foreground">/ 200g goal</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fat</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{nutritionData.totalFat}g</div>
                <p className="text-xs text-muted-foreground">/ 65g goal</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Today's Meals</CardTitle>
            </CardHeader>
            <CardContent>
              {nutritionData.meals.length > 0 ? (
                <div className="space-y-4">
                  {nutritionData.meals.map((meal) => (
                    <div key={meal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <div className="font-medium">{meal.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {meal.time}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{meal.calories} kcal</div>
                        <div className="text-xs text-muted-foreground">
                          P: {meal.protein}g · C: {meal.carbs}g · F: {meal.fat}g
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Utensils className="h-8 w-8 mx-auto mb-2" />
                  <p>No meals logged yet</p>
                  <Button 
                    variant="ghost" 
                    className="mt-2"
                    onClick={() => setShowAddMeal(true)}
                  >
                    Add your first meal
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Meal History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-8 w-8 mx-auto mb-2" />
                <p>Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Nutrition Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart2 className="h-8 w-8 mx-auto mb-2" />
                <p>Coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Meal Dialog */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Add Meal</h3>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowAddMeal(false)}
              >
                ✕
              </Button>
            </div>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleAddMeal({
                name: formData.get('name') as string,
                time: formData.get('time') as string,
                calories: Number(formData.get('calories')),
                protein: Number(formData.get('protein')),
                carbs: Number(formData.get('carbs')),
                fat: Number(formData.get('fat')),
              });
            }} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-1">Meal Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="w-full p-2 border rounded"
                  placeholder="e.g., Grilled Chicken Salad"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="time" className="block text-sm font-medium mb-1">Time</label>
                  <input
                    id="time"
                    name="time"
                    type="time"
                    required
                    className="w-full p-2 border rounded"
                    defaultValue={new Date().toTimeString().substring(0, 5)}
                  />
                </div>
                <div>
                  <label htmlFor="calories" className="block text-sm font-medium mb-1">Calories</label>
                  <input
                    id="calories"
                    name="calories"
                    type="number"
                    required
                    min="0"
                    className="w-full p-2 border rounded"
                    placeholder="kcal"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label htmlFor="protein" className="block text-sm font-medium mb-1">Protein (g)</label>
                  <input
                    id="protein"
                    name="protein"
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full p-2 border rounded"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="carbs" className="block text-sm font-medium mb-1">Carbs (g)</label>
                  <input
                    id="carbs"
                    name="carbs"
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full p-2 border rounded"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="fat" className="block text-sm font-medium mb-1">Fat (g)</label>
                  <input
                    id="fat"
                    name="fat"
                    type="number"
                    step="0.1"
                    min="0"
                    className="w-full p-2 border rounded"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMeal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Add Meal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
