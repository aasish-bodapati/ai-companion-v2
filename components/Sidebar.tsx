import Link from 'next/link';
import { Home, BookOpen, Activity, Settings, Heart, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Sidebar() {
  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-gray-200 bg-white">
        <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-gray-900">AI Companion</h1>
          </div>
          <div className="mt-5 flex-1 flex flex-col
           px-2 space-y-1">
            <Link href="/dashboard" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100">
              <Home className="mr-3 h-5 w-5 text-gray-500" />
              Dashboard
            </Link>
            <Link href="/dashboard/chat" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md bg-gray-100">
              <BookOpen className="mr-3 h-5 w-5 text-gray-500" />
              Journal
            </Link>
            <Link href="/dashboard/fitness" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100">
              <Activity className="mr-3 h-5 w-5 text-gray-500" />
              Fitness
            </Link>
            <Link href="/dashboard/settings" className="flex items-center px-2 py-2 text-sm font-medium text-gray-900 rounded-md hover:bg-gray-100">
              <Settings className="mr-3 h-5 w-5 text-gray-500" />
              Settings
            </Link>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <Button className="w-full bg-[#A8BAAA] hover:bg-[#A8BAAA]/90">
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>
    </div>
  );
}
