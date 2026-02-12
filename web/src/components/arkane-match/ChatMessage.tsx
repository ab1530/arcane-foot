"use client";

import { motion } from "framer-motion";
import { Bot, User, Copy, Check } from "lucide-react";
import { ChatMessage as ChatMessageType } from "@/types/arkane-match";
import { ScoutCardMini } from "./ScoutCardMini";
import { SearchCriteriaBadges } from "./SearchCriteriaBadges";
import { SuggestionChips } from "./SuggestionChips";
import { useState } from "react";

interface ChatMessageProps {
  message: ChatMessageType;
  onScoutClick?: (scoutId: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

/**
 * ChatMessage Component
 * Renders user or AI messages with different styles and features
 */
export function ChatMessage({
  message,
  onScoutClick,
  onSuggestionClick,
}: ChatMessageProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex items-start gap-3 mb-6 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-arcane-accent/20 border border-arcane-accent/30"
            : "bg-gradient-to-br from-arcane-accent/30 to-arcane-accent/10 border border-arcane-accent/30"
        }`}
      >
        {isUser ? (
          <User className="h-4 w-4 text-arcane-accent" />
        ) : (
          <Bot className="h-4 w-4 text-arcane-accent" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 max-w-3xl ${isUser ? "flex flex-col items-end" : ""}`}>
        {/* Message Bubble */}
        <div
          className={`group relative ${
            isUser
              ? "bg-arcane-accent/90 text-arcane-dark px-6 py-3 rounded-2xl rounded-tr-sm"
              : "bg-arcane-darkCard backdrop-blur-md border border-arcane-darkBorder/50 p-6 rounded-2xl rounded-tl-sm"
          }`}
        >
          {/* Copy Button (AI messages only) */}
          {!isUser && (
            <button
              onClick={handleCopy}
              className="absolute top-3 right-3 p-1.5 rounded-md bg-arcane-dark/50 hover:bg-arcane-dark opacity-0 group-hover:opacity-100 transition-all"
              aria-label="Copy message"
            >
              {copied ? (
                <Check className="h-3 w-3 text-green-400" />
              ) : (
                <Copy className="h-3 w-3 text-arcane-grey" />
              )}
            </button>
          )}

          {/* Text Content */}
          <p
            className={`text-sm leading-relaxed whitespace-pre-wrap ${
              isUser ? "text-arcane-dark font-semibold" : "text-white"
            }`}
          >
            {message.content}
          </p>

          {/* Scout Cards (AI messages only) */}
          {!isUser && message.scouts && message.scouts.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-arcane-darkBorder/50" />
                <span className="text-xs text-arcane-grey font-semibold uppercase tracking-wider">
                  {message.scouts.length} Scout{message.scouts.length !== 1 ? "s" : ""} Found
                </span>
                <div className="h-px flex-1 bg-arcane-darkBorder/50" />
              </div>

              {message.scouts.map((scout) => (
                <ScoutCardMini
                  key={scout.id}
                  scout={scout}
                  onClick={() => onScoutClick?.(scout.id)}
                />
              ))}
            </div>
          )}

          {/* Extracted Criteria (AI messages only) */}
          {!isUser && message.extractedCriteria && (
            <SearchCriteriaBadges criteria={message.extractedCriteria} />
          )}

          {/* Suggestion Chips (AI messages only) */}
          {!isUser && message.suggestions && message.suggestions.length > 0 && (
            <SuggestionChips
              suggestions={message.suggestions}
              onClick={(suggestion) => onSuggestionClick?.(suggestion)}
            />
          )}
        </div>

        {/* Timestamp */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={`text-xs text-arcane-grey mt-1 px-2 ${isUser ? "text-right" : ""}`}
        >
          {formatTime(message.timestamp)}
        </motion.div>
      </div>
    </motion.div>
  );
}
