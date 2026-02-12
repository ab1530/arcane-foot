"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Trash2, RotateCcw } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { ChatMessage as ChatMessageType } from "@/types/arkane-match";
import {
  ChatMessage,
  ChatInput,
  TypingIndicator,
  EmptyState,
} from "@/components/arkane-match";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";

/**
 * ArkaneMatch Chat Page
 * AI-powered conversational interface for finding scouts
 */
export default function ArkaneMatchPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Send message to AI
  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    // Create user message
    const userMessage: ChatMessageType = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError(null);

    try {
      // Call API
      const response = await apiClient.arkaneMatchChat({
        message: text,
        conversationId: conversationId || undefined,
      });

      // Create AI message
      const aiMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.response,
        scouts: response.scouts,
        extractedCriteria: response.extractedCriteria,
        suggestions: response.suggestions,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      // Save conversation ID
      if (response.conversationId) {
        setConversationId(response.conversationId);
      }
    } catch (err: any) {
      console.error("Failed to get AI response:", err);
      setError(err.message || "Failed to get response. Please try again.");

      // Add error message
      const errorMessage: ChatMessageType = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "Sorry, I encountered an error. Please try again or rephrase your question.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle scout card click
  const handleScoutClick = (scoutId: string) => {
    router.push(`/marketplace/scouts/${scoutId}`);
  };

  // Handle suggestion chip click
  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  // Handle example query click
  const handleExampleClick = (query: string) => {
    sendMessage(query);
  };

  // Clear conversation
  const clearConversation = async () => {
    if (conversationId) {
      try {
        await apiClient.clearArkaneMatchConversation(conversationId);
      } catch (err) {
        console.error("Failed to clear conversation:", err);
      }
    }

    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  // Restart conversation
  const restartConversation = () => {
    setMessages([]);
    setConversationId(null);
    setError(null);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="min-h-screen bg-arcane-dark flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-arcane-dark/80 backdrop-blur-md border-b border-arcane-darkBorder"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-arcane-accent/20 blur-xl rounded-full" />
                <div className="relative bg-gradient-to-br from-arcane-accent/30 to-arcane-accent/10 p-3 rounded-full border-2 border-arcane-accent/30">
                  <Sparkles className="h-6 w-6 text-arcane-accent" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">ArkaneMatch</h1>
                <p className="text-sm text-arcane-grey">
                  Find your perfect scout with AI
                </p>
              </div>
            </div>

            {/* Actions */}
            {hasMessages && (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={restartConversation}
                  className="text-arcane-grey hover:text-white"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearConversation}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.header>

      {/* Chat Container */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6"
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Empty State */}
          {!hasMessages && !isLoading && (
            <EmptyState onExampleClick={handleExampleClick} />
          )}

          {/* Messages */}
          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onScoutClick={handleScoutClick}
                onSuggestionClick={handleSuggestionClick}
              />
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isLoading && <TypingIndicator />}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4"
            >
              <GlassCard variant="bordered" className="border-red-500/50">
                <div className="flex items-center gap-2 text-red-400">
                  <span className="text-sm">{error}</span>
                </div>
              </GlassCard>
            </motion.div>
          )}

          {/* Scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="sticky bottom-0 z-50">
        <ChatInput
          onSend={sendMessage}
          disabled={isLoading}
          placeholder="Ask me anything about scouts..."
        />
      </div>
    </div>
  );
}
