import { DebugUtils } from '../utils/debugUtils';



// This is a fallback implementation that will be replaced by the actual toast context
// when used within a component that has access to the ToastProvider
let toastContext: Record<string, unknown> | null = null;

export const showToast = {
  success: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    if (toastContext) {
      toastContext.showToast(fullMessage, 'success', 4000);
    } else {
      DebugUtils.log('🔍 [TOAST] Success:', fullMessage);
    }
  },

  error: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    if (toastContext) {
      toastContext.showToast(fullMessage, 'error', 5000);
    } else {
      DebugUtils.log('🔍 [TOAST] Error:', fullMessage);
    }
  },

  info: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    if (toastContext) {
      toastContext.showToast(fullMessage, 'info', 3000);
    } else {
      DebugUtils.log('🔍 [TOAST] Info:', fullMessage);
    }
  },

  warning: (message: string, description?: string) => {
    const fullMessage = description ? `${message}: ${description}` : message;
    if (toastContext) {
      toastContext.showToast(fullMessage, 'warning', 4000);
    } else {
      DebugUtils.log('🔍 [TOAST] Warning:', fullMessage);
    }
  },
};

// Function to set the toast context (called from components that have access to it)
export const setToastContext = (context: Record<string, unknown>) => {
  toastContext = context;
};
