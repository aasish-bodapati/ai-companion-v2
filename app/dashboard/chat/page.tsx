import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SendHorizontal } from 'lucide-react';

export default function ChatPage() {
  // Mock messages - will be replaced with real data later
  const messages = [
    { id: 1, sender: 'ai', content: 'Hello! How are you feeling today?', timestamp: new Date(Date.now() - 1000 * 60 * 5) },
    { id: 2, sender: 'user', content: 'I\'m doing okay, thanks for asking!', timestamp: new Date(Date.now() - 1000 * 60 * 3) },
    { id: 3, sender: 'ai', content: 'That\'s good to hear! What would you like to talk about today?', timestamp: new Date(Date.now() - 1000 * 60 * 2) },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Journal Chat</h1>
        <Button variant="outline">New Entry</Button>
      </div>
      
      <ScrollArea className="flex-1 mb-4 rounded-lg border p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  message.sender === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p className="text-xs opacity-70 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      <div className="flex items-center space-x-2">
        <Input 
          placeholder="Type your thoughts here..." 
          className="flex-1"
        />
        <Button size="icon">
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
