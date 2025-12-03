'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
}

export function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center flex-wrap gap-1 text-sm">
        {showHome && (
          <li className="flex items-center">
            <Link
              href="/dashboard"
              className="text-gray-500 hover:text-purple-600 transition-colors flex items-center gap-1 focus:ring-2 focus:ring-purple-500 focus:outline-none rounded px-1"
              aria-label="Dashboard"
            >
              <Home className="w-4 h-4" />
              <span className="sr-only sm:not-sr-only">Dashboard</span>
            </Link>
          </li>
        )}
        
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" aria-hidden="true" />
            {item.href ? (
              <Link
                href={item.href}
                className="text-gray-500 hover:text-purple-600 transition-colors focus:ring-2 focus:ring-purple-500 focus:outline-none rounded px-1"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-gray-900 font-medium px-1" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
