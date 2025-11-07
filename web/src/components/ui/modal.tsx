"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { useFocusTrap } from "@/lib/accessibility/hooks";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export function Modal({ isOpen, onClose, title, children, size = "md" }: ModalProps) {
  const focusTrapRef = useFocusTrap(isOpen);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  // Store the element that triggered the modal
  useEffect(() => {
    if (isOpen) {
      returnFocusRef.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key and return focus
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
        // Return focus to the element that opened the modal
        setTimeout(() => {
          returnFocusRef.current?.focus();
        }, 0);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-2xl",
    lg: "max-w-4xl",
    xl: "max-w-6xl",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={focusTrapRef as any}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className={`relative w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}
          >
            {/* Glass Card */}
            <div className="relative bg-arcane-dark/95 backdrop-blur-xl border border-arcane-darkBorder rounded-2xl shadow-2xl">
              {/* Accent Glow */}
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-arcane-accent/20 rounded-full blur-3xl" aria-hidden="true" />
              <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-arcane-accent/10 rounded-full blur-3xl" aria-hidden="true" />

              {/* Header */}
              <div className="relative flex items-center justify-between px-8 py-6 border-b border-arcane-darkBorder/50">
                <h2
                  id="modal-title"
                  className="text-2xl font-black text-white uppercase tracking-tight"
                >
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-arcane-darkBorder/50 transition-colors group"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5 text-arcane-grey group-hover:text-white transition-colors" aria-hidden="true" />
                </button>
              </div>

              {/* Content */}
              <div className="relative overflow-y-auto max-h-[calc(90vh-120px)] px-8 py-6">
                {children}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
