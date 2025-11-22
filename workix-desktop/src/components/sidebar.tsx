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
        'bg-gray-900 text-white transition-all duration-300 ease-in-out overflow-hidden',
        sidebarOpen ? 'w-64' : 'w-20'
      )}
    >
      <div className="p-4">
        <div className="text-2xl font-bold">W</div>
      </div>

      <nav className="mt-8 space-y-2 px-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800'
              )}
              title={item.label}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm">{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
