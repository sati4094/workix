'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  /** Optional specific path to navigate to. If not provided, uses router.back() */
  href?: string;
  /** Custom label text (defaults to "Back") */
  label?: string;
  /** Whether to show the label (defaults to false for icon-only) */
  showLabel?: boolean;
  /** Custom aria-label for accessibility */
  ariaLabel?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Standardized back navigation button component.
 * Use this component for consistent back navigation across all pages.
 */
export function BackButton({
  href,
  label = 'Back',
  showLabel = false,
  ariaLabel,
  className = '',
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${className}`}
      aria-label={ariaLabel || `${label}${href ? ` to ${href.split('/').pop()}` : ''}`}
    >
      <ArrowLeft className="w-5 h-5" />
      {showLabel && <span className="font-medium">{label}</span>}
    </button>
  );
}

export default BackButton;
