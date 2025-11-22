'use client';

import { ReactNode } from 'react';
import { Navbar } from './navbar';
import { Sidebar } from './sidebar';

export function DesktopLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
