'use client';

import { useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

interface AuthGuardProps {
  children: ReactNode;
  /** Where to redirect if not authenticated */
  redirectTo?: string;
  /** Show custom loading state */
  loadingComponent?: ReactNode;
}

/**
 * AuthGuard component that prevents flash of protected content
 * by waiting for Zustand hydration before checking auth state.
 * 
 * Usage:
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 */
export function AuthGuard({ 
  children, 
  redirectTo = '/login',
  loadingComponent 
}: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuthStore();

  useEffect(() => {
    // Only redirect after hydration is complete
    if (hydrated && !isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [hydrated, isAuthenticated, router, redirectTo]);

  // Show loading while hydrating
  if (!hydrated) {
    if (loadingComponent) {
      return <>{loadingComponent}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // After hydration, if not authenticated, show nothing (redirecting)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500 mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // Authenticated and hydrated - render children
  return <>{children}</>;
}

export default AuthGuard;
