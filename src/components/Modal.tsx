import { ReactNode, useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'full';
  position?: 'center' | 'bottom' | 'right';
}

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  size = 'md',
  position = 'center',
}: ModalProps) {
  useEffect(() => {
    // Don't lock body scroll - let the modal overlay handle scrolling
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    full: 'max-w-full sm:max-w-md',
  };

  const contentClasses = position === 'bottom'
    ? 'rounded-t-2xl w-full animate-slide-up'
    : position === 'right'
    ? 'fixed right-0 top-0 h-full w-full sm:w-auto rounded-none sm:rounded-l-2xl animate-slide-left'
    : 'rounded-xl sm:rounded-2xl animate-scale-in';

  const containerClasses = position === 'right'
    ? 'fixed top-0 left-0 right-0 bottom-0 z-[100] flex justify-end'
    : 'fixed top-0 left-0 right-0 bottom-0 z-[100] flex items-start justify-center overflow-y-auto py-2 sm:py-4 md:py-8';

  return (
    <div className={containerClasses}>
      <div
        className="fixed top-0 left-0 right-0 bottom-0 bg-black/50"
        onClick={onClose}
      />
      <div className={`relative bg-white dark:bg-gray-800 ${contentClasses} ${sizeClasses[size]} w-full ${position === 'right' ? '' : 'mx-2 sm:mx-4 my-auto max-h-[calc(100vh-1rem)] sm:max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-4rem)]'} shadow-2xl overflow-y-auto`}>
        {title && (
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white pr-2 truncate">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        )}
        <div className="p-3 sm:p-4">
          {children}
        </div>
      </div>
    </div>
  );
}
