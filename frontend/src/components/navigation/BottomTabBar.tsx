'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import { 
  HomeIcon, 
  ChartBarIcon, 
  PlusIcon, 
  CalendarIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { 
  HomeIcon as HomeIconSolid, 
  ChartBarIcon as ChartBarIconSolid, 
  CalendarIcon as CalendarIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid';
import QuickAddModal from '@/components/health/QuickAddModal';

interface TabItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  activeIcon: React.ComponentType<{ className?: string }>;
  showWhenAuthenticated?: boolean;
}

const tabs: TabItem[] = [
  {
    href: '/dashboard',
    label: 'Dashboard',
    icon: HomeIcon,
    activeIcon: HomeIconSolid,
    showWhenAuthenticated: true
  },
  {
    href: '/fitness',
    label: 'Fitness',
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
    showWhenAuthenticated: true
  },
  {
    href: '/quick-add',
    label: 'Add',
    icon: PlusIcon,
    activeIcon: PlusIcon,
    showWhenAuthenticated: true
  },
  {
    href: '/nutrition',
    label: 'Nutrition',
    icon: ChartBarIcon,
    activeIcon: ChartBarIconSolid,
    showWhenAuthenticated: true
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: UserIcon,
    activeIcon: UserIconSolid,
    showWhenAuthenticated: true
  }
];

// Helper functions for tab styling
function getActiveTabStyles(href: string): string {
  switch (href) {
    case '/dashboard':
      return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm';
    case '/fitness':
      return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 shadow-sm';
    case '/nutrition':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm';
    case '/progress':
      return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-sm';
    case '/quick-add':
      return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm';
    case '/profile':
      return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 shadow-sm';
    default:
      return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 shadow-sm';
  }
}

function getInactiveTabStyles(href: string): string {
  switch (href) {
    case '/dashboard':
      return 'text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/10';
    case '/fitness':
      return 'text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/10';
    case '/nutrition':
      return 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10';
    case '/progress':
      return 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10';
    case '/quick-add':
      return 'text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10';
    case '/profile':
      return 'text-gray-500 dark:text-gray-400 hover:text-slate-600 dark:hover:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/10';
    default:
      return 'text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/10';
  }
}

export default function BottomTabBar() {
  const { isAuthenticated } = useAuth();
  const pathname = usePathname();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Don't show on auth pages
  if (['/login', '/register'].includes(pathname)) {
    return null;
  }

  // Only show for authenticated users
  if (!isAuthenticated) {
    return null;
  }

  const visibleTabs = tabs.filter(tab => tab.showWhenAuthenticated);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-around h-16">
          {visibleTabs.map((tab) => {
          const isActive = pathname === tab.href || 
            (tab.href === '/dashboard' && (pathname === '/' || pathname === '/dashboard')) ||
            (tab.href === '/fitness' && pathname.startsWith('/fitness')) ||
            (tab.href === '/nutrition' && pathname.startsWith('/nutrition')) ||
            (tab.href === '/quick-add' && pathname.startsWith('/quick-add')) ||
            (tab.href === '/profile' && pathname.startsWith('/profile'));

          const IconComponent = isActive ? tab.activeIcon : tab.icon;

          // Handle plus button click to open modal
          if (tab.href === '/quick-add') {
            return (
              <button
                key={tab.href}
                onClick={() => setIsQuickAddOpen(true)}
                className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
                  isActive
                    ? getActiveTabStyles(tab.href)
                    : getInactiveTabStyles(tab.href)
                }`}
              >
                <IconComponent className="h-6 w-6 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-lg transition-all duration-200 ${
                isActive
                  ? getActiveTabStyles(tab.href)
                  : getInactiveTabStyles(tab.href)
              }`}
            >
              <IconComponent className="h-6 w-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          );
        })}
          </div>
        </div>
      </div>
      
      {/* Quick Add Modal */}
      <QuickAddModal 
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSuccess={() => {
          // Refresh data or show success message
          console.log('Quick add successful');
        }}
      />
    </nav>
  );
}
