'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store';
import clsx from 'clsx';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Wrench, 
  Building2, 
  MapPin, 
  Building, 
  Target, 
  Package, 
  Zap, 
  BarChart3, 
  Users, 
  FileText, 
  Settings,
  X 
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Work Orders', href: '/work-orders', icon: ClipboardList },
  { label: 'Assets', href: '/assets', icon: Wrench },
  { label: 'Enterprises', href: '/dashboard/enterprises', icon: Building2 },
  { label: 'Sites', href: '/dashboard/sites', icon: MapPin },
  { label: 'Buildings', href: '/dashboard/buildings', icon: Building },
  { label: 'Projects', href: '/dashboard/projects', icon: Target },
  { label: 'Inventory', href: '/dashboard/inventory', icon: Package },
  { label: 'PPM', href: '/dashboard/ppm', icon: Zap },
  { label: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
  { label: 'Users', href: '/users', icon: Users },
  { label: 'Reports', href: '/dashboard/reports', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <>
      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <aside
        className={clsx(
          'bg-gradient-to-b from-purple-900 via-purple-800 to-pink-900 text-white transition-all duration-300 ease-in-out overflow-hidden shadow-xl',
          // Desktop: relative positioning with width transition
          'md:relative md:h-auto',
          sidebarOpen ? 'md:w-52' : 'md:w-16',
          // Mobile: fixed overlay that slides in/out
          'fixed top-0 left-0 h-full z-40',
          sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-16'
        )}
        role="navigation"
        aria-label="Sidebar navigation"
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-3 md:hidden">
          <span className="text-lg font-bold">Menu</span>
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors focus:ring-2 focus:ring-white/50 focus:outline-none"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-2 hidden md:block"></div>

        <nav className="mt-2 md:mt-8 space-y-1 px-2 font-sans" role="menubar">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  // Close sidebar on mobile after navigation
                  if (window.innerWidth < 768) {
                    toggleSidebar();
                  }
                }}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all focus:ring-2 focus:ring-white/50 focus:outline-none',
                  isActive
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold shadow-lg'
                    : 'text-gray-200 hover:bg-white/10 hover:text-white hover:shadow-md'
                )}
                title={item.label}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon 
                  className={clsx(
                    'w-5 h-5 flex-shrink-0',
                    isActive ? 'text-white' : 'text-white/80'
                  )} 
                  aria-hidden="true"
                />
                {/* Always show label on mobile, conditionally on desktop */}
                <span className={clsx(
                  'text-sm font-sans truncate',
                  isActive ? 'text-white' : 'text-white/90',
                  'md:hidden', // Always show on mobile
                  sidebarOpen && 'md:inline' // Show on desktop when expanded
                )}>
                  {item.label}
                </span>
                {/* Desktop collapsed - show label only when sidebar open */}
                {sidebarOpen && (
                  <span className={clsx(
                    'text-sm font-sans truncate hidden md:inline',
                    isActive ? 'text-white' : 'text-white/90'
                  )}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
