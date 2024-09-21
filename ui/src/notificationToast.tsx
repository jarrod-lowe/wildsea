import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';

const MaxToasts = 5;

interface ToastContextType {
  addToast: (message: string, type: 'error' | 'success') => void;
}

// Create the context with a default value
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Custom hook to use the ToastContext
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// ToastProvider component that wraps the ToastManager
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<{ id: string, message: string, type: 'error' | 'success' }[]>([]);

  // Function to add a toast
  const addToast = (message: string, type: 'error' | 'success') => {
    setToasts((currentToasts) => {
      // Remove the oldest toast if we've reached the maximum number
      if (currentToasts.length >= MaxToasts) {
        currentToasts.shift(); // Remove the first (oldest) toast
      }
      return [...currentToasts, { id: uuidv4(), message, type }];
    });
  };

  // Function to remove a toast
  const removeToast = (id: string) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  // Memoize the context value so it doesn't change on every render
  const contextValue = useMemo(() => ({ addToast }), [toasts]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastManager toasts={toasts} removeToast={removeToast} /> {/* Render ToastManager here */}
    </ToastContext.Provider>
  );
};

interface Toast {
  id: string;
  message: string;
  type: 'error' | 'success';
}

interface ToastManagerProps {
  toasts: Toast[];
  removeToast: (id: string) => void;
}

export const ToastManager: React.FC<ToastManagerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-manager">
      {toasts.map((toast) => (
        <NotificationToast
          key={toast.id} // Unique key
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)} // Close specific toast
        />
      ))}
    </div>
  );
};

interface NotificationToastProps {
  message: string;
  type: 'error' | 'success';
  duration?: number;
  onClose?: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ message, type, duration = 5000, onClose }) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Start fading out slightly before the toast is removed
    const fadeOutTimer = setTimeout(() => {
      setIsFadingOut(true); // Start fade out animation
    }, duration - 300); // Start fading out 300ms before the full duration

    // Remove the toast completely after the full duration
    const removeTimer = setTimeout(() => {
      if (onClose) {
        onClose(); // Remove toast after animation completes
      }
    }, duration);

    // Cleanup timers on component unmount or re-render
    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(removeTimer);
    };
  }, [duration, onClose]);

  return (
    <div className={`notification-toast ${type} ${isFadingOut ? 'fade-out' : ''}`}>
      <p>{message}</p>
    </div>
  );
};
