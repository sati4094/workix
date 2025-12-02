'use client';

import { useAuthStore, useUIStore } from '@/store';
import { useState, useEffect } from 'react';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const { toggleSidebar } = useUIStore();
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    setIsTauri(typeof window !== 'undefined' && '__TAURI__' in window);
  }, []);

  const handleMinimize = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (error) {
      console.error('Failed to minimize:', error);
    }
  };

  const handleMaximize = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      const maximized = await appWindow.isMaximized();
      if (maximized) {
        await appWindow.unmaximize();
      } else {
        await appWindow.maximize();
      }
    } catch (error) {
      console.error('Failed to maximize:', error);
    }
  };

  const handleClose = async () => {
    if (!isTauri) return;
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (error) {
      console.error('Failed to close:', error);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between" role="navigation" aria-label="Main navigation">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors focus:ring-2 focus:ring-purple-500 focus:outline-none"
          aria-label="Toggle sidebar navigation"
          aria-expanded="true"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Workix Desktop</h1>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {user && (
          <>
            <div className="flex items-center gap-2">
              <div 
                className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold text-sm shadow-md"
                aria-hidden="true"
              >
                {user.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm text-gray-700">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 hover:bg-red-100 text-red-600 rounded transition-colors focus:ring-2 focus:ring-red-500 focus:outline-none"
              aria-label="Sign out of your account"
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
