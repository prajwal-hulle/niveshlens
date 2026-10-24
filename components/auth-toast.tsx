"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastProps {
  type: "success" | "error" | "info";
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
}

export function AuthToast({ type, message, onClose, autoClose = true }: ToastProps) {
  useEffect(() => {
    if (!autoClose || !onClose) return;
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [autoClose, onClose]);

  const styles = {
    success: "bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300",
    error: "bg-rose-50 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300",
    info: "bg-blue-50 dark:bg-blue-950/80 border-blue-300 dark:border-blue-800 text-blue-800 dark:text-blue-300",
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />,
    info: <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />,
  };

  return (
    <div
      role={type === "error" ? "alert" : "status"}
      aria-live="polite"
      className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-xs font-medium animate-in fade-in slide-in-from-top-1 duration-150 ${styles[type]}`}
    >
      <div className="mt-0.5">{icons[type]}</div>
      <div className="flex-1 leading-relaxed">{message}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5 opacity-70 hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
