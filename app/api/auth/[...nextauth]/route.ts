import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const action = formData.get('action') as 'signin' | 'signup' | 'signout';

  const supabase = createRouteHandlerClient({ cookies });

  try {
    if (action === 'signin') {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status || 400 }
        );
      }

      return NextResponse.json({ user: data.user });
    } 
    
    else if (action === 'signup') {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${requestUrl.origin}/auth/callback`,
        },
      });

      if (error) {
        return NextResponse.json(
          { error: error.message },
          { status: error.status || 400 }
        );
      }

      return NextResponse.json({ user: data.user });
    } 
    
    else if (action === 'signout') {
      await supabase.auth.signOut();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return NextResponse.json({ user: null });
  }
  
  return NextResponse.json({ user: session.user });
}
