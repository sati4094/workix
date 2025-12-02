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
  Settings 
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
  const { sidebarOpen } = useUIStore();

  return (
    <aside
      className={clsx(
        'bg-gradient-to-b from-purple-900 via-purple-800 to-pink-900 text-white transition-all duration-300 ease-in-out overflow-hidden shadow-xl',
        sidebarOpen ? 'w-48 md:w-48' : 'w-14',
        // Mobile: overlay when open
        'fixed md:relative z-40 h-full md:h-auto'
      )}
      role="navigation"
      aria-label="Sidebar navigation"
    >
      <div className="p-2"></div>

      <nav className="mt-8 space-y-1 px-2 font-sans" role="menubar">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
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
              {sidebarOpen && (
                <span className={clsx('text-sm font-sans truncate', isActive ? 'text-white' : 'text-white/90')}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
