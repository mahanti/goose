import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { cn } from '../../utils';

export type ToastState = 'loading' | 'success' | 'error';

export interface CustomToast {
  id: string;
  title: string;
  state: ToastState;
  duration?: number;
}

interface ToastContextType {
  showToast: (toast: Omit<CustomToast, 'id'>) => string;
  updateToast: (id: string, updates: Partial<Pick<CustomToast, 'state' | 'title'>>) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useCustomToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useCustomToast must be used within a ToastProvider');
  }
  return context;
};

// Alias for convenience
export const useToast = useCustomToast;

interface ToastItemProps {
  toast: CustomToast;
  onRemove: (id: string) => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // Animate in when component mounts
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-hide successful/error toasts
  useEffect(() => {
    if (toast.state !== 'loading') {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => onRemove(toast.id), 200); // Wait for exit animation
      }, toast.duration || 3000);
      return () => clearTimeout(timer);
    }
    // Return undefined for loading state (satisfies TypeScript)
    return undefined;
  }, [toast.state, toast.duration, toast.id, onRemove]);

  const getStateIcon = () => {
    switch (toast.state) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />;
    }
  };

  const getStateStyles = (): string => {
    // Always use white background regardless of state
    return 'bg-white dark:bg-white';
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-200',
        getStateStyles(),
        'transform transition-spring',
        isVisible && !isExiting
          ? 'translate-y-0 opacity-100 scale-100 blur-0'
          : isExiting
            ? 'translate-y-[-20px] opacity-0 scale-95 blur-[4px]'
            : 'translate-y-[-20px] opacity-0 scale-95 blur-[8px]'
      )}
      style={
        {
          '--tx': '0',
          '--ty': isVisible && !isExiting ? '0' : '-20px',
          '--scale': isVisible && !isExiting ? '1' : '0.95',
          '--blur': isVisible && !isExiting ? '0px' : isExiting ? '4px' : '8px',
          boxShadow:
            '0 12px 32px 0 rgba(0, 0, 0, 0.04), 0 8px 16px 0 rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.04), 0 0 1px 0 rgba(0, 0, 0, 0.20)',
        } as React.CSSProperties
      }
    >
      {getStateIcon()}
      <span className="text-sm font-medium text-black dark:text-black">{toast.title}</span>
    </div>
  );
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<CustomToast[]>([]);

  const showToast = useCallback((toast: Omit<CustomToast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast = { ...toast, id };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const updateToast = useCallback(
    (id: string, updates: Partial<Pick<CustomToast, 'state' | 'title'>>) => {
      setToasts((prev) =>
        prev.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast))
      );
    },
    []
  );

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, updateToast, hideToast }}>
      {children}

      {/* Toast Container */}
      <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-[9999] pointer-events-none">
        <div className="flex flex-col-reverse gap-2 items-center">
          {toasts.map((toast) => (
            <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
