'use client'

import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Bell, LogOut, User } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuthStore()

  return (
    <header className="h-16 border-b bg-white px-6 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {/* Page title will be shown here */}
        </h2>
      </div>

      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5" />
        </Button>

        {/* User Info */}
        <div className="flex items-center space-x-3 border-l pl-4">
          <div className="text-right">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.role?.toUpperCase()}</p>
          </div>
          
          <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
            {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>

          <Button variant="ghost" size="icon" onClick={logout} title="Logout">
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}

