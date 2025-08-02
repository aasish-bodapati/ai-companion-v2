"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Home, MessageSquare, BarChart3, BookOpen, Settings, Plus, X, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FloatingNav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Chat', path: '/dashboard/chat', icon: MessageSquare },
    { name: 'Progress', path: '/dashboard/progress', icon: BarChart3 },
    { name: 'Journal', path: '/dashboard/journal', icon: BookOpen },
    { name: 'Settings', path: '/dashboard/settings', icon: Settings },
  ];

  return (
    <>
      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className={`rounded-full h-14 w-14 p-0 shadow-lg transition-all duration-300 ${
            isMenuOpen ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isMenuOpen ? (
            <X className="h-6 w-6 text-white" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </Button>
      </div>

      {/* Navigation Menu */}
      <div
        className={`fixed bottom-24 right-6 z-40 transition-all duration-300 transform ${
          isMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-white rounded-xl shadow-xl p-4 space-y-3 min-w-[200px]">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              <item.icon className="h-5 w-5 mr-3 text-indigo-600" />
              <span className="font-medium">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Navigation (Mobile) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-500 hover:text-indigo-600 transition-colors"
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs mt-1">{item.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
