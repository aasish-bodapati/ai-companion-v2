import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies });
  
  // Get the current user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Fetch fitness activities for the current user
  const { data, error } = await supabase
    .from('fitness_activities')
    .select('*')
    .eq('user_id', session.user.id)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching fitness activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fitness activities' },
      { status: 500 }
    );
  }

  return NextResponse.json({ activities: data });
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { activity_type, duration, calories, notes } = await request.json();
  
  // Get the current user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Insert new fitness activity
  const { data, error } = await supabase
    .from('fitness_activities')
    .insert([
      { 
        user_id: session.user.id,
        activity_type,
        duration_minutes: Number(duration),
        calories_burned: Number(calories),
        notes,
        date: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Error creating fitness activity:', error);
    return NextResponse.json(
      { error: 'Failed to log fitness activity' },
      { status: 500 }
    );
  }

  return NextResponse.json({ activity: data?.[0] });
}
