'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUIStore } from '@/store';
import clsx from 'clsx';

const menuItems = [
  { label: 'Dashboard', href: '/dashboard', icon: '📊' },
  { label: 'Work Orders', href: '/work-orders', icon: '📋' },
  { label: 'Assets', href: '/assets', icon: '🔧' },
  { label: 'Inventory', href: '/dashboard/inventory', icon: '📦' },
  { label: 'Clients', href: '/dashboard/clients', icon: '🏢' },
  { label: 'Projects', href: '/dashboard/projects', icon: '🎯' },
  { label: 'Sites', href: '/dashboard/sites', icon: '📍' },
  { label: 'PPM', href: '/dashboard/ppm', icon: '⚡' },
  { label: 'Templates', href: '/dashboard/templates', icon: '📝' },
  { label: 'SLA Policies', href: '/dashboard/sla-policies', icon: '⏱️' },
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
        'bg-gradient-to-b from-[#3a3d43] via-[#5b5f65] to-[#232428] text-white transition-all duration-300 ease-in-out overflow-hidden',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="p-4"></div>

      <nav className="mt-8 space-y-2 px-2 font-sans">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-white/15 text-white font-semibold shadow'
                  : 'text-gray-200 hover:bg-white/10 hover:text-white'
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
