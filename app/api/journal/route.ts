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

  // Fetch journal entries for the current user
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching journal entries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch journal entries' },
      { status: 500 }
    );
  }

  return NextResponse.json({ entries: data });
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { content, mood } = await request.json();
  
  // Get the current user
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Not authenticated' },
      { status: 401 }
    );
  }

  // Insert new journal entry
  const { data, error } = await supabase
    .from('journal_entries')
    .insert([
      { 
        user_id: session.user.id,
        content,
        mood,
        created_at: new Date().toISOString()
      }
    ])
    .select();

  if (error) {
    console.error('Error creating journal entry:', error);
    return NextResponse.json(
      { error: 'Failed to create journal entry' },
      { status: 500 }
    );
  }

  return NextResponse.json({ entry: data?.[0] });
}
