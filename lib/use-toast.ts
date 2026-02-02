"use client";

import * as React from "react";
import type { ToastProps } from "@radix-ui/react-toast";

type ToastInput = ToastProps & {
  title?: string;
  description?: string;
};

type ToastState = ToastInput & { id: string };

const ToastContext = React.createContext<{
  toasts: ToastState[];
  push: (toast: ToastInput) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastState[]>([]);

  const push = React.useCallback((toast: ToastInput) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, duration: 4000, ...toast }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, push }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
