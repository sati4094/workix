'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Building2,
  Package,
  Calendar,
  BarChart3,
  Settings,
  Wrench,
  MapPin,
  Briefcase,
  Upload,
  FileText,
  Building
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Work Orders', href: '/dashboard/work-orders', icon: ClipboardList },
  { name: 'Users', href: '/dashboard/users', icon: Users },
  { name: 'Enterprises', href: '/dashboard/enterprises', icon: Briefcase },
  { name: 'Projects', href: '/dashboard/projects', icon: Building2 },
  { name: 'Sites', href: '/dashboard/sites', icon: MapPin },
  { name: 'Buildings', href: '/dashboard/buildings', icon: Building },
  { name: 'Assets', href: '/dashboard/assets', icon: Package },
  { name: 'Bulk Onboarding', href: '/dashboard/onboarding', icon: Upload },
  { name: 'Reports', href: '/dashboard/reports', icon: FileText },
  { name: 'PPM Schedule', href: '/dashboard/ppm', icon: Calendar },
  { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col bg-gray-900 text-white">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-gray-800">
        <Wrench className="h-8 w-8 text-blue-500" />
        <span className="ml-2 text-xl font-bold">Workix</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5 flex-shrink-0',
                  isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-300'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-800 p-4">
        <p className="text-xs text-gray-400">Workix v1.0.0</p>
        <p className="text-xs text-gray-500">EPC Service Platform</p>
      </div>
    </div>
  )
}

