import { useEffect } from 'react';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  isOpen: boolean;
  onClose: () => void;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function Toast({ message, type = 'success', isOpen, onClose, duration = 3000, action }: ToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-green-500" />,
    error: <XCircle className="w-5 h-5 text-red-500" />,
    info: <AlertCircle className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: 'bg-gray-900',
    error: 'bg-red-900',
    info: 'bg-blue-900',
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex justify-center animate-slide-up">
      <div className={`${bgColors[type]} text-white rounded-lg shadow-2xl p-4 flex items-center gap-3 max-w-md w-full`}>
        {icons[type]}
        <p className="flex-1 font-medium">{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className="text-blue-300 hover:text-blue-200 font-semibold text-sm"
          >
            {action.label}
          </button>
        )}
        <button
          onClick={onClose}
          className="p-1 hover:bg-white hover:bg-opacity-10 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
