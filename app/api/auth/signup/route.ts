import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Initialize Supabase Admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: Request) {
  const { email, password } = await request.json();

  try {
    // Check if user already exists using the admin API
    const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listUsersError) {
      console.error('Error listing users:', listUsersError);
      throw new Error('Failed to check existing users');
    }

    const userExists = users?.some(user => user.email === email);
    
    if (userExists) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create new user using the admin API
    const { data: createdUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm the user's email
      user_metadata: { name: email.split('@')[0] } // Add some basic metadata
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      throw new Error(signUpError.message);
    }

    const user = createdUser.user;

    // Log the successful signup
    console.log('Signup successful:', {
      userId: user?.id,
      email: user?.email,
      timestamp: new Date().toISOString()
    });

    // Return success response
    const response = { 
      success: true, 
      message: 'Signup successful!',
      userId: user?.id
    };
    
    console.log('Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Signup error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred during signup';
    const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : 'unknown_error';
    const statusCode = error && typeof error === 'object' && 'status' in error ? (error as any).status : 500;
    
    return NextResponse.json(
      { 
        error: errorMessage,
        code: errorCode
      },
      { status: statusCode }
    );
  }
}
