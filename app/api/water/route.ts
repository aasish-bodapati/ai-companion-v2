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

  // Get today's date at midnight for filtering
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  // Fetch today's water intake for the current user
  const { data, error } = await supabase
    .from('water_intake')
    .select('*')
    .eq('user_id', session.user.id)
    .gte('timestamp', todayISO)
    .order('timestamp', { ascending: false });

  if (error) {
    console.error('Error fetching water intake:', error);
    return NextResponse.json(
      { error: 'Failed to fetch water intake data' },
      { status: 500 }
    );
  }

  return NextResponse.json({ entries: data });
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { amount_ml } = await request.json();
  
  // Get the current user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Insert new water intake record
  const { data, error } = await supabase
    .from('water_intake')
    .insert([
      { 
        user_id: session.user.id,
        amount_ml: Number(amount_ml),
        timestamp: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Error logging water intake:', error);
    return NextResponse.json(
      { error: 'Failed to log water intake' },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry: data?.[0] });
}
