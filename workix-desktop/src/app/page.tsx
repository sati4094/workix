'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopLayout } from '@/components/desktop-layout';
import { useAuthStore } from '@/store';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();
  const [appVersion, setAppVersion] = useState('0.1.0');
  const [loading, setLoading] = useState(true);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    loadAppVersion();
  }, []);

  const loadAppVersion = async () => {
    try {
      // Check if we're in Tauri context
      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        setIsTauri(true);
        const { invoke } = await import('@tauri-apps/api/core');
        const version = await invoke<string>('get_app_version');
        setAppVersion(version);
      } else {
        setIsTauri(false);
        setAppVersion('0.1.0 (Web)');
      }
    } catch (error) {
      console.error('Failed to load app version:', error);
      setAppVersion('0.1.0 (Fallback)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DesktopLayout>
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome to Workix Desktop</h1>
          <p className="text-lg text-gray-600">EPC Service Management Platform</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center space-x-2">
            <div className="h-3 w-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse"></div>
            <div className="h-3 w-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="h-3 w-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">System Info</h2>
                <p className="text-gray-600">Version: {appVersion}</p>
                <p className="text-gray-600">Platform: {typeof window !== 'undefined' ? navigator.platform : 'Loading...'}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Quick Start</h2>
                <ul className="space-y-2 text-gray-600">
                  <li>✅ Navigate using the sidebar</li>
                  <li>✅ View your work orders</li>
                  <li>✅ Manage projects and assets</li>
                </ul>
              </div>
            </div>

            {isTauri && (
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-lg mb-6">
                <h3 className="text-xl font-bold mb-2">🗄️ Offline Storage Available</h3>
                <p className="mb-4">Native SQLite database is ready. Test offline functionality and sync features.</p>
                <button 
                  onClick={() => router.push('/test-offline')}
                  className="bg-white text-green-600 px-6 py-2 rounded font-semibold hover:bg-gray-100 transition-colors"
                >
                  Test Offline Features
                </button>
              </div>
            )}

            <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-purple-700 text-white p-8 rounded-lg shadow-xl">
              <h3 className="text-2xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="mb-4">Access all features from the sidebar menu to manage your EPC service operations.</p>
              <button 
                onClick={() => router.push('/dashboard')}
                className="bg-white text-purple-600 px-6 py-2 rounded font-semibold hover:bg-gray-100 transition-colors shadow-md focus:ring-2 focus:ring-white focus:outline-none"
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </DesktopLayout>
  );
}
