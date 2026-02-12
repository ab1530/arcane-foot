"use client";

import { useState, useRef, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Send, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * ChatInput Component
 * Multi-line text input with send button
 * Features: Auto-expand, Enter to send, Shift+Enter for new line
 */
export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Type your message...",
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = 500;

  const handleSend = () => {
    const trimmedValue = value.trim();
    if (trimmedValue && !disabled) {
      onSend(trimmedValue);
      setValue("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setValue(newValue);
      // Auto-expand textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
      }
    }
  };

  const examples = [
    "I need a LaLiga scout",
    "Find Bundesliga specialists",
    "Scout under €150/hr",
  ];

  const remainingChars = maxLength - value.length;
  const showCharCount = remainingChars < 50;

  return (
    <div className="border-t border-arcane-darkBorder bg-arcane-dark/80 backdrop-blur-md">
      <div className="max-w-4xl mx-auto p-4">
        {/* Input Area */}
        <div className="relative flex items-end gap-2">
          {/* Textarea Container */}
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className="w-full px-4 py-3 pr-12 bg-arcane-darkCard border border-arcane-darkBorder focus:border-arcane-accent/50 rounded-lg text-white placeholder:text-arcane-grey resize-none outline-none transition-all duration-200 max-h-32 overflow-y-auto disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ minHeight: "48px" }}
            />

            {/* Character Count */}
            {showCharCount && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute bottom-2 right-2 text-xs text-arcane-grey"
              >
                {remainingChars}
              </motion.div>
            )}
          </div>

          {/* Voice Input Button (Optional - Future Feature) */}
          {/* <Button
            variant="ghost"
            size="icon"
            disabled={disabled}
            className="flex-shrink-0"
          >
            <Mic className="h-5 w-5" />
          </Button> */}

          {/* Send Button */}
          <Button
            onClick={handleSend}
            disabled={disabled || !value.trim()}
            variant="primary"
            size="icon"
            className="flex-shrink-0 h-12 w-12"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>

        {/* Example Prompts */}
        {!value && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-2 mt-3 text-xs text-arcane-grey"
          >
            <span className="font-semibold">Try:</span>
            {examples.map((example, index) => (
              <span key={index}>
                <button
                  onClick={() => setValue(example)}
                  disabled={disabled}
                  className="text-arcane-accent hover:text-arcane-accentHover hover:underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  "{example}"
                </button>
                {index < examples.length - 1 && <span className="mx-1">|</span>}
              </span>
            ))}
          </motion.div>
        )}

        {/* Keyboard Hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs text-arcane-grey/60 mt-2 text-center"
        >
          <kbd className="px-1.5 py-0.5 rounded bg-arcane-darkCard border border-arcane-darkBorder text-xs">
            Enter
          </kbd>{" "}
          to send •{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-arcane-darkCard border border-arcane-darkBorder text-xs">
            Shift + Enter
          </kbd>{" "}
          for new line
        </motion.div>
      </div>
    </div>
  );
}
