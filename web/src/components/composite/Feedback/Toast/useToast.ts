'use client';

import { create } from 'zustand';
import { Toast, ToastOptions, ToastVariant } from './types';

/**
 * Toast store state
 */
interface ToastStore {
  toasts: Toast[];
  addToast: (title: string, options?: ToastOptions) => void;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

/**
 * Global toast store using Zustand
 */
export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (title: string, options?: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title,
      variant: options?.variant || 'info',
      description: options?.description,
      duration: options?.duration ?? 3000,
      action: options?.action,
      icon: options?.icon,
      createdAt: Date.now(),
    };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    // Auto-dismiss if duration is set
    const duration = newToast.duration ?? 0;
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },

  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  clearAll: () => {
    set({ toasts: [] });
  },
}));

/**
 * Toast hook for components
 */
export const useToast = () => {
  const { addToast, removeToast, clearAll } = useToastStore();

  return {
    toast: (title: string, options?: ToastOptions) => addToast(title, options),
    success: (title: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, { ...options, variant: 'success' }),
    error: (title: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, { ...options, variant: 'error' }),
    info: (title: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, { ...options, variant: 'info' }),
    warning: (title: string, options?: Omit<ToastOptions, 'variant'>) =>
      addToast(title, { ...options, variant: 'warning' }),
    dismiss: removeToast,
    clearAll,
  };
};

/**
 * Helper function for creating toasts without hooks
 */
export const toast = {
  show: (title: string, options?: ToastOptions) => {
    useToastStore.getState().addToast(title, options);
  },
  success: (title: string, options?: Omit<ToastOptions, 'variant'>) => {
    useToastStore.getState().addToast(title, { ...options, variant: 'success' });
  },
  error: (title: string, options?: Omit<ToastOptions, 'variant'>) => {
    useToastStore.getState().addToast(title, { ...options, variant: 'error' });
  },
  info: (title: string, options?: Omit<ToastOptions, 'variant'>) => {
    useToastStore.getState().addToast(title, { ...options, variant: 'info' });
  },
  warning: (title: string, options?: Omit<ToastOptions, 'variant'>) => {
    useToastStore.getState().addToast(title, { ...options, variant: 'warning' });
  },
  dismiss: (id: string) => {
    useToastStore.getState().removeToast(id);
  },
  clearAll: () => {
    useToastStore.getState().clearAll();
  },
};
