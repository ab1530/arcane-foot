"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  TrendingUp,
  Users,
  Trophy,
  Target,
  Loader2,
  ChevronRight,
  Brain,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/ui/animated-background";
import MainLayout from "@/components/layout/MainLayout";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { RequireTier } from "@/components/auth/RequireTier";
import { apiClient } from "@/lib/api-client";
import { useLanguage } from "@/contexts/language-context";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestionIconMap = {
  trending: TrendingUp,
  users: Users,
  trophy: Trophy,
  target: Target,
} as const;

export default function ArkaneGPTPage() {
  const { dictionary, language } = useLanguage();
  const gptCopy = dictionary.aiTools.gpt;
  const fallback = gptCopy.fallback;

  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: "welcome",
      role: "assistant",
      content: gptCopy.welcome,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0].id !== "welcome" || prev[0].content === gptCopy.welcome) {
        return prev;
      }
      const [, ...rest] = prev;
      return [{ ...prev[0], content: gptCopy.welcome }, ...rest];
    });
  }, [gptCopy.welcome]);

  const suggestions = useMemo(
    () =>
      gptCopy.suggestions.map((suggestion) => ({
        ...suggestion,
        Icon: suggestionIconMap[suggestion.icon as keyof typeof suggestionIconMap] ?? Sparkles,
      })),
    [gptCopy],
  );

  const handleSendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const response = await apiClient.generateAiSummary(text);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.summary,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("AI summary failed:", error);
      const fallbackMessage =
        (fallback as { error?: string })?.error ??
        "Sorry, I couldn't process your request. Please try again later.";
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: fallbackMessage,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <MainLayout>
      <ProtectedPage>
        <RequireTier minTier="PRO">
          <div className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

      <div className="relative z-10 h-screen flex flex-col">
        {/* Header */}
        <div className="border-b border-arcane-darkBorder bg-arcane-dark/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-arcane-accent to-green-500 flex items-center justify-center">
                <Brain className="h-6 w-6 text-arcane-dark" />
              </div>
              <div>
                <h1
                  className="text-2xl font-black text-white uppercase tracking-tight"
                  data-test="arkane-gpt-header-title"
                >
                  {gptCopy.header.title}
                </h1>
                <p className="text-arcane-grey text-sm" data-test="arkane-gpt-header-subtitle">
                  {gptCopy.header.subtitle}
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-400 font-bold" data-test="arkane-gpt-header-status">
                    {gptCopy.header.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className={`mb-6 flex gap-4 ${
                      message.role === "user" ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                        message.role === "user"
                          ? "bg-arcane-accent/20"
                          : "bg-gradient-to-br from-arcane-accent to-green-500"
                      }`}
                    >
                      {message.role === "user" ? (
                        <User className="h-5 w-5 text-arcane-accent" />
                      ) : (
                        <Bot className="h-5 w-5 text-arcane-dark" />
                      )}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`flex-1 max-w-2xl ${
                        message.role === "user" ? "text-right" : "text-left"
                      }`}
                    >
                      <div
                        className={`inline-block px-4 py-3 rounded-lg ${
                          message.role === "user"
                            ? "bg-arcane-accent/20 border border-arcane-accent/30"
                            : "bg-arcane-darkBorder/50 border border-arcane-darkBorder"
                        }`}
                      >
                        <p
                          className="text-white text-sm whitespace-pre-line"
                          style={{ textAlign: "left" }}
                        >
                          {message.content}
                        </p>
                      </div>
                      <p className="text-xs text-arcane-grey mt-1">
                        {message.timestamp.toLocaleTimeString(language === "fr" ? "fr-FR" : "en-US", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Typing Indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 flex gap-4"
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-arcane-accent to-green-500 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-arcane-dark" />
                  </div>
                  <div className="bg-arcane-darkBorder/50 border border-arcane-darkBorder px-4 py-3 rounded-lg">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 rounded-full bg-arcane-accent animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-arcane-accent animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-arcane-accent animate-bounce [animation-delay:0.4s]" />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />

              {/* Suggested Questions */}
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8"
                >
                  <h3
                    className="text-arcane-grey text-sm mb-4 flex items-center gap-2"
                    data-test="arkane-gpt-suggestions-title"
                  >
                    <Sparkles className="h-4 w-4" />
                    {gptCopy.suggestionsTitle}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestions.map((q) => {
                      const Icon = q.Icon;
                      return (
                        <button
                          key={q.text}
                          onClick={() => handleSuggestedQuestion(q.text)}
                          className="text-left p-4 rounded-lg border border-arcane-darkBorder bg-arcane-darkBorder/30 hover:border-arcane-accent/50 hover:bg-arcane-accent/5 transition-all group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 rounded-lg bg-arcane-accent/20 flex items-center justify-center flex-shrink-0 group-hover:bg-arcane-accent/30 transition-colors">
                              <Icon className="h-4 w-4 text-arcane-accent" />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs text-arcane-accent font-bold mb-1">
                                {q.category}
                              </p>
                              <p className="text-sm text-white">{q.text}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-arcane-grey group-hover:text-arcane-accent transition-colors" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Input Area */}
          <div className="border-t border-arcane-darkBorder bg-arcane-dark/50 backdrop-blur-sm">
            <div className="container mx-auto px-4 py-4 max-w-4xl">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={gptCopy.input.placeholder}
                  className="flex-1 px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20"
                  disabled={isTyping}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80 px-6"
                >
                  {isTyping ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </form>
                <p className="text-xs text-arcane-grey mt-2 text-center" data-test="arkane-gpt-input-warning">
                  {gptCopy.input.warning}
                </p>
            </div>
          </div>
        </div>
        </div>
      </div>
        </RequireTier>
      </ProtectedPage>
    </MainLayout>
  );
}
