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
    <nav className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-gray-900">Workix Desktop</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user.name?.charAt(0) || 'U'}
              </div>
              <span className="text-sm text-gray-600">{user.name}</span>
            </div>
            <button
              onClick={logout}
              className="text-sm px-3 py-1 hover:bg-red-100 text-red-600 rounded transition-colors"
            >
              Logout
            </button>
          </>
        )}
      </div>

      {/* Window controls */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={handleMinimize}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Minimize"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 13H5v-2h14v2z" />
          </svg>
        </button>
        <button
          onClick={handleMaximize}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Maximize"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
          </svg>
        </button>
        <button
          onClick={handleClose}
          className="p-1 hover:bg-red-100 rounded transition-colors"
          title="Close"
        >
          <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" />
          </svg>
        </button>
      </div>
    </nav>
  );
}
