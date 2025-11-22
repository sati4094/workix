'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

interface WithAuthOptions {
  requiredRoles?: string[];
  redirectTo?: string;
}

export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: WithAuthOptions = {}
) {
  const { requiredRoles = [], redirectTo = '/login' } = options;

  return function AuthenticatedComponent(props: P) {
    const router = useRouter();
    const { isAuthenticated, user } = useAuthStore();

    useEffect(() => {
      if (!isAuthenticated) {
        router.push(redirectTo);
        return;
      }

      if (requiredRoles.length > 0 && user) {
        const hasRequiredRole = requiredRoles.includes(user.role);
        if (!hasRequiredRole) {
          router.push('/dashboard');
        }
      }
    }, [isAuthenticated, user, router]);

    if (!isAuthenticated) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return <Component {...props} />;
  };
}
