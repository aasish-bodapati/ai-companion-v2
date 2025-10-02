import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';
import Toast, { ToastType } from '../components/ui/Toast';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType, duration?: number) => void;
  showBulkToast: (message: string, count: number, type: ToastType, duration?: number) => void;
  showRapidToast: (baseMessage: string, type: ToastType, duration?: number) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [currentToast, setCurrentToast] = useState<ToastItem | null>(null);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const rapidOperationsRef = useRef<Map<string, { count: number; lastTime: number }>>(new Map());

  const showToast = (message: string, type: ToastType, duration = 3000) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newToast: ToastItem = {
      id,
      message,
      type,
      duration,
    };

    setToastQueue(prev => [...prev, newToast]);
  };

  const showBulkToast = (message: string, count: number, type: ToastType, duration = 2000) => {
    const bulkMessage = count > 1 ? `${message} (${count} items)` : message;
    showToast(bulkMessage, type, duration);
  };

  const showRapidToast = (baseMessage: string, type: ToastType, duration = 2000) => {
    const now = Date.now();
    const operationKey = `${baseMessage}-${type}`;
    const existing = rapidOperationsRef.current.get(operationKey);
    
    if (existing && now - existing.lastTime < 2000) {
      // Within 2 seconds, increment count
      existing.count += 1;
      existing.lastTime = now;
      
      // Clear any existing individual toasts for this operation
      setToastQueue(prev => prev.filter(toast => 
        !toast.message.includes(baseMessage) || toast.type !== type
      ));
      
      // Show bulk notification
      const bulkMessage = `${baseMessage} (${existing.count} items)`;
      showToast(bulkMessage, type, duration);
    } else {
      // First operation or after timeout, reset and show individual
      rapidOperationsRef.current.set(operationKey, { count: 1, lastTime: now });
      showToast(baseMessage, type, duration);
    }
  };

  const hideToast = () => {
    setVisible(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Process next toast in queue after a short delay
    setTimeout(() => {
      setToastQueue(prev => {
        const next = prev.slice(1);
        if (next.length > 0) {
          setCurrentToast(next[0]);
          setVisible(true);
          timeoutRef.current = setTimeout(() => {
            hideToast();
          }, next[0].duration);
        } else {
          setCurrentToast(null);
        }
        return next;
      });
    }, 100);
  };

  // Process queue when it changes
  useEffect(() => {
    if (toastQueue.length > 0 && !currentToast && !visible) {
      const nextToast = toastQueue[0];
      setCurrentToast(nextToast);
      setVisible(true);
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, nextToast.duration);
    }
  }, [toastQueue, currentToast, visible]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showBulkToast, showRapidToast, hideToast }}>
      {children}
      {currentToast && (
        <Toast
          visible={visible}
          message={currentToast.message}
          type={currentToast.type}
          duration={currentToast.duration}
          onHide={hideToast}
          queueCount={toastQueue.length - 1}
        />
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
