import { ReactNode, useEffect, useRef, useCallback } from 'react';
import { UseFormReturn } from 'react-hook-form';

interface CrudModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  title: string;
  children: ReactNode;
  submitText?: string;
  isSubmitting?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function CrudModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = 'Save',
  isSubmitting = false,
  size = 'md',
}: CrudModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap implementation
  const handleTabKey = useCallback((e: KeyboardEvent) => {
    if (!modalRef.current) return;
    
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement?.focus();
    } else if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement?.focus();
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
      if (e.key === 'Tab' && isOpen) {
        handleTabKey(e);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
      // Focus first focusable element when modal opens
      setTimeout(() => firstFocusableRef.current?.focus(), 0);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, isSubmitting, handleTabKey]);

  if (!isOpen) return null;

  // Responsive size classes
  const sizeClasses = {
    sm: 'max-w-full sm:max-w-md',
    md: 'max-w-full sm:max-w-lg md:max-w-2xl',
    lg: 'max-w-full sm:max-w-xl md:max-w-3xl lg:max-w-4xl',
    xl: 'max-w-full sm:max-w-2xl md:max-w-4xl lg:max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className={`relative bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4 rounded-t-lg flex items-center justify-between">
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold text-gray-900">{title}</h2>
            <button
              ref={firstFocusableRef}
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors focus:ring-2 focus:ring-purple-500 focus:outline-none rounded"
              disabled={isSubmitting}
              aria-label="Close modal"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
            {children}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 rounded-b-lg flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSubmitting ? 'Saving...' : submitText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
