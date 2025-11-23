'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store';
import clsx from 'clsx';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Work Orders', href: '/work-orders', icon: '📋' },
  { label: 'Assets', href: '/assets', icon: '🔧' },
  { label: 'Enterprises', href: '/dashboard/enterprises', icon: '🏢' },
  { label: 'Sites', href: '/dashboard/sites', icon: '📍' },
  { label: 'Buildings', href: '/dashboard/buildings', icon: '🏗️' },
  { label: 'Projects', href: '/dashboard/projects', icon: '🎯' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: '📦' },
  { label: 'PPM', href: '/dashboard/ppm', icon: '⚡' },
  { label: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
  { label: 'Users', href: '/users', icon: '👥' },
  { label: 'Reports', href: '/dashboard/reports', icon: '📑' },
  { label: 'Settings', href: '/settings', icon: '⚙️' },
];

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen } = useUIStore();

  return (
    <aside
      className={clsx(
        'bg-gradient-to-b from-purple-900 via-purple-800 to-pink-900 text-white transition-all duration-300 ease-in-out overflow-hidden shadow-xl',
        sidebarOpen ? 'w-40' : 'w-12'
      )}
    >
      <div className="p-2"></div>

      <nav className="mt-8 space-y-2 px-2 font-sans">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold shadow-lg'
                  : 'text-gray-200 hover:bg-white/10 hover:text-white hover:shadow-md'
              )}
              title={item.label}
            >
              <span className={clsx(
                'text-xl flex items-center',
                isActive ? 'text-white drop-shadow' : 'text-white/80'
              )}>
                {item.icon}
              </span>
              {sidebarOpen && <span className={clsx('text-sm font-sans', isActive ? 'text-white' : 'text-white/90')}>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
