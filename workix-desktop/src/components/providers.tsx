'use client';

import { ReactNode } from 'react';
import { QueryProvider } from '@/lib/query-provider';
import { Toaster } from 'react-hot-toast';
import { ErrorBoundary } from './ErrorBoundary';

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <QueryProvider>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            success: {
              style: {
                background: '#10B981',
                color: '#fff',
              },
            },
            error: {
              style: {
                background: '#EF4444',
                color: '#fff',
              },
            },
          }}
        />
      </QueryProvider>
    </ErrorBoundary>
  );
}
