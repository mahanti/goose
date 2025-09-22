import { useCallback, useRef } from 'react';
import { useCustomToast } from '../components/ui/custom-toast';

export const useExtensionToast = () => {
  const { showToast, updateToast, hideToast } = useCustomToast();
  const activeToasts = useRef<Map<string, string>>(new Map()); // extensionName -> toastId

  const showExtensionLoading = useCallback(
    (extensionName: string, action: 'Enabling' | 'Disabling') => {
      // Hide any existing toast for this extension
      const existingToastId = activeToasts.current.get(extensionName);
      if (existingToastId) {
        hideToast(existingToastId);
      }

      // Show new loading toast
      const toastId = showToast({
        title: `${action} ${extensionName}...`,
        state: 'loading',
      });

      activeToasts.current.set(extensionName, toastId);
      return toastId;
    },
    [showToast, hideToast]
  );

  const updateExtensionToast = useCallback(
    (extensionName: string, success: boolean, action: 'Enabled' | 'Disabled') => {
      const toastId = activeToasts.current.get(extensionName);
      if (!toastId) return;

      updateToast(toastId, {
        title: success
          ? `${extensionName} ${action.toLowerCase()}`
          : `Failed to ${action.toLowerCase()} ${extensionName}`,
        state: success ? 'success' : 'error',
      });

      // Clean up reference after toast auto-hides
      if (success || !success) {
        setTimeout(() => {
          activeToasts.current.delete(extensionName);
        }, 3500); // Slightly longer than toast duration to ensure cleanup
      }
    },
    [updateToast]
  );

  const hideExtensionToast = useCallback(
    (extensionName: string) => {
      const toastId = activeToasts.current.get(extensionName);
      if (toastId) {
        hideToast(toastId);
        activeToasts.current.delete(extensionName);
      }
    },
    [hideToast]
  );

  return {
    showExtensionLoading,
    updateExtensionToast,
    hideExtensionToast,
  };
};
