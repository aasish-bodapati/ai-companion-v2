"use client";

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { SendHorizontal, Mic, Plus, Loader2, Bot, User, Sparkles, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useTheme } from 'next-themes';

type Suggestion = {
  text: string;
  prompt: string;
};

type Message = {
  id: number | string;
  sender: 'user' | 'ai';
  content: string;
  timestamp: Date;
  mood?: 'happy' | 'neutral' | 'sad' | 'excited' | 'calm';
  isTyping?: boolean;
};

// Breathing dot component for presence indicator
function BreathingDot() {
  return (
    <div className="relative w-2 h-2 mr-2">
      <div className="absolute inset-0 bg-green-600 rounded-full opacity-75 animate-ping" style={{ animationDuration: '4s' }} />
      <div className="absolute inset-0 bg-green-600 rounded-full" />
    </div>
  );
}

const SUGGESTIONS: Suggestion[] = [
  { text: 'How can I stay motivated?', prompt: 'Give me tips for staying motivated with my fitness goals' },
  { text: 'Meal ideas', prompt: 'Suggest some healthy meal ideas for dinner' },
  { text: 'Workout plan', prompt: 'Create a 3-day workout plan for beginners' },
  { text: 'Mindfulness tips', prompt: 'Share some quick mindfulness exercises' },
];

const MOOD_EMOJI: Record<string, string> = {
  happy: '😊',
  neutral: '😐',
  sad: '😔',
  excited: '🎉',
  calm: '🧘',
};

export default function ChatPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  // Only render theme toggle after mounting to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: 'welcome', 
      sender: 'ai', 
      content: 'Hello! I\'m your AI companion. How can I assist you with your personal growth today? 💫', 
      timestamp: new Date(),
      mood: 'excited'
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Simulate typing effect
  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSendMessage = async (messageContent = input) => {
    if ((!messageContent && !messageContent.trim()) || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now(),
      sender: 'user',
      content: messageContent,
      timestamp: new Date(),
    };
    
    // Add user message immediately
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      // Prepare messages for the API
      const apiMessages = updatedMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));
      
      // Call our API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response from AI');
      }
      
      const data = await response.json();
      
      // Add AI response to messages
      const aiMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        content: data.message?.content || 'I\'m not sure how to respond to that.',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
        mood: 'sad'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    handleSendMessage(suggestion.prompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  // Get time-appropriate greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="h-3 w-3 bg-green-500 rounded-full absolute -right-0.5 -bottom-0.5 border-2 border-background z-10"></div>
              <Avatar className="h-10 w-10 bg-primary/10">
                <AvatarFallback className="bg-transparent">
                  <Bot className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <h1 className="font-semibold text-lg">AI Companion</h1>
              <div className="flex items-center space-x-1">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <p className="text-xs text-muted-foreground">Active now</p>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {mounted && (
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} 
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4 space-y-4 bg-background">
        <div className="max-w-3xl mx-auto w-full space-y-6">
          {/* Welcome message */}
          <div className="text-center py-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">How can I help you today?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Ask me anything about fitness, nutrition, or personal growth. I'm here to support you!
            </p>
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {SUGGESTIONS.map((suggestion, i) => (
                <Card 
                  key={i}
                  className="p-4 text-left hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <p className="text-sm">{suggestion.text}</p>
                </Card>
              ))}
            </div>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex group',
                message.sender === 'user' ? 'justify-end' : 'justify-start',
                'text-foreground' // Ensure text is visible in dark mode
              )}
            >
              <div className="flex max-w-[85%] md:max-w-[70%] space-x-2">
                {message.sender === 'ai' && (
                  <Avatar className="h-8 w-8 mt-1 bg-primary/10">
                    <AvatarFallback className="bg-transparent">
                      <Bot className="h-4 w-4 text-primary" />
                    </AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div
                    className={cn(
                      'px-4 py-2.5 rounded-lg',
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground rounded-tr-none'
                        : 'bg-muted text-white rounded-tl-none',
                      message.sender === 'ai' && message.mood ? 'pb-6' : ''
                    )}
                  >
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    
                    {message.sender === 'ai' && message.mood && (
                      <div className="text-xs text-muted-foreground mt-1 flex items-center">
                        <span className="mr-1">{MOOD_EMOJI[message.mood] || '💭'}</span>
                        <span className="capitalize">{message.mood}</span>
                      </div>
                    )}
                    
                    <div className={cn(
                      'text-xs mt-1',
                      message.sender === 'user' ? 'text-right' : 'text-left',
                      message.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                    )}>
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex items-start space-x-2">
              <Avatar className="h-8 w-8 mt-1 bg-primary/10">
                <AvatarFallback className="bg-transparent">
                  <Bot className="h-4 w-4 text-primary" />
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-1 bg-muted rounded-full px-4 py-2.5">
                <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="h-2 w-2 bg-muted-foreground/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} className="h-4" />
        </div>
      </ScrollArea>
      
      {/* Input area */}
      <div className="border-t bg-card/50 backdrop-blur-sm p-4">
        <div className="max-w-3xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="relative"
          >
            <div className="relative">
              <Input
                ref={inputRef}
                placeholder="Message your AI companion..."
                className="pr-24 bg-background"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex space-x-1">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => {
                    // Handle attachment
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 text-muted-foreground"
                  onClick={() => {
                    // Handle voice input
                  }}
                >
                  <Mic className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Button 
              type="submit" 
              size="sm" 
              className="absolute right-2.5 bottom-2.5 h-8 w-8 p-0 rounded-full"
              disabled={!input.trim() || isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Your AI companion may produce inaccurate information. Consider verifying important details.
          </p>
        </div>
      </div>
    </div>
  );
}
