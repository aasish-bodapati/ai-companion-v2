"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Plus, MessageSquare, Dumbbell, Utensils, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Home', href: '/dashboard', icon: Home },
  { name: 'Journal', href: '/dashboard/log', icon: BookOpen },
  { name: 'Companion', href: '/dashboard/chat', icon: MessageSquare },
  { name: 'Fitness', href: '/dashboard/fitness', icon: Dumbbell },
  { name: 'Nutrition', href: '/dashboard/nutrition', icon: Utensils },
];

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="w-full bg-gray-900 border-t border-gray-800 shadow-lg">
      <div className="flex justify-around items-center h-16 max-w-2xl mx-auto px-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || 
                         (pathname?.startsWith(item.href) && item.href !== '/dashboard');
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors px-1",
                isActive 
                  ? "text-indigo-400" 
                  : "text-gray-400 hover:text-indigo-300"
              )}
            >
              <div className={cn(
                "p-2 rounded-full transition-colors",
                isActive ? "bg-indigo-900/30" : "hover:bg-gray-800/50"
              )}>
                <item.icon className={cn(
                  "h-5 w-5 mx-auto",
                  isActive ? "text-indigo-400" : "text-gray-400"
                )} />
              </div>
              <span className={cn(
                "text-xs mt-0.5 transition-colors",
                isActive ? "text-indigo-400 font-medium" : "text-gray-400"
              )}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
