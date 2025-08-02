'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Plus, Calendar, Clock, BookOpen, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    
    if (editingId) {
      // Update existing entry
      setEntries(entries.map(entry => 
        entry.id === editingId 
          ? { ...entry, title, content, updatedAt: now }
          : entry
      ));
      setEditingId(null);
    } else {
      // Add new entry
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        title,
        content,
        date: new Date().toISOString().split('T')[0],
        createdAt: now,
        updatedAt: now,
      };
      setEntries([newEntry, ...entries]);
    }
    
    // Reset form
    setTitle('');
    setContent('');
  };

  const handleEdit = (entry: JournalEntry) => {
    setTitle(entry.title);
    setContent(entry.content);
    setEditingId(entry.id);
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(entry => entry.id !== id));
    if (editingId === id) {
      setTitle('');
      setContent('');
      setEditingId(null);
    }
  };

  const filteredEntries = entries.filter(entry => 
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const entriesByDate = filteredEntries.reduce<Record<string, JournalEntry[]>>((groups, entry) => {
    const date = new Date(entry.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(entry);
    return groups;
  }, {});

  return (
    <div className="space-y-6 text-white">
      <div className="flex flex-col space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Journal</h1>
        <p className="text-sm text-gray-400">
          {format(new Date(), 'MMMM d, yyyy')} • Record your thoughts and reflections
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <BookOpen className="h-5 w-5 text-indigo-400" />
            {editingId ? 'Edit Entry' : 'New Entry'}
          </CardTitle>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                required
              />
              <Textarea
                placeholder="Write your thoughts here..."
                className="min-h-[150px] bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setTitle('');
                  setContent('');
                  setEditingId(null);
                }}
              >
                Cancel
              </Button>
            )}
            <Button type="submit">
              <Plus className="h-4 w-4 mr-2" />
              {editingId ? 'Update Entry' : 'Add Entry'}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="space-y-2">
        <div className="relative">
          <Input
            placeholder="Search entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-indigo-500"
          />
          <BookOpen className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        </div>
      </div>

      <div className="space-y-8">
        {Object.entries(entriesByDate).map(([date, dateEntries]) => (
          <div key={date} className="space-y-4">
            <h2 className="text-lg font-semibold">{date}</h2>
            <div className="space-y-4">
              {dateEntries.map((entry) => (
                <Card key={entry.id} className="relative group bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg text-white">{entry.title}</CardTitle>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 mr-1" />
                        {new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {entry.createdAt !== entry.updatedAt && (
                        <span className="text-xs text-gray-500">
                          (edited)
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-line text-gray-300">{entry.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
        
        {filteredEntries.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>No journal entries found</p>
            <p className="text-sm mt-1">
              {searchQuery ? 'Try a different search term' : 'Start by creating your first entry'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
