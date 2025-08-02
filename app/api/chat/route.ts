import { NextResponse } from 'next/server';

// This will be used at runtime, not during build time
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const TOGETHER_API_URL = 'https://api.together.xyz/v1/chat/completions';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    if (!TOGETHER_API_KEY) {
      throw new Error('TOGETHER_API_KEY is not set in environment variables');
    }

    // Call Together.ai's API
    const response = await fetch(TOGETHER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3-70b-chat-hf',
        messages,
        max_tokens: 1000,
        temperature: 0.7,
        top_p: 0.7,
        top_k: 50,
        repetition_penalty: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Together.ai API error:', errorData);
      throw new Error(`Together.ai API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Format the response to match what the frontend expects
    return NextResponse.json({
      message: {
        role: 'assistant',
        content: data.choices[0]?.message?.content || 'No response from AI',
      }
    });
    
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process chat message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
