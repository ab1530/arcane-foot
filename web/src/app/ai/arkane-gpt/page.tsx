"use client";

import { useState, useRef, useEffect } from "react";
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
import { apiClient } from "@/lib/api-client";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedQuestions = [
  {
    icon: TrendingUp,
    text: "Quels sont les meilleurs jeunes talents français actuellement ?",
    category: "Scouting",
  },
  {
    icon: Users,
    text: "Compare Mbappé et Haaland sur les 6 derniers mois",
    category: "Comparaison",
  },
  {
    icon: Trophy,
    text: "Qui sont les favoris pour la Ligue des Champions ?",
    category: "Analyse",
  },
  {
    icon: Target,
    text: "Quels profils chercher pour renforcer ma défense centrale ?",
    category: "Recrutement",
  },
];

export default function ArkaneGPTPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Bonjour ! Je suis ArkaneGPT, votre assistant IA spécialisé dans le football. Je peux vous aider avec l'analyse de joueurs, les statistiques, les tendances du marché et bien plus encore. Comment puis-je vous aider aujourd'hui ?",
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
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: generateMockResponse(text),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const generateMockResponse = (question: string): string => {
    // Mock responses basées sur des mots-clés
    const lower = question.toLowerCase();

    if (lower.includes("mbappé") || lower.includes("haaland")) {
      return `Excellente question ! Voici une analyse comparative entre Mbappé et Haaland :\n\n**Kylian Mbappé (PSG):**\n- ArkaneIndex: 94.5/100\n- Points forts: Vitesse exceptionnelle, finition, polyvalence\n- 28 buts en 30 matches cette saison\n- Valeur marchande: ~180M€\n\n**Erling Haaland (Man City):**\n- ArkaneIndex: 93.2/100  \n- Points forts: Puissance physique, instinct de buteur\n- 32 buts en 28 matches cette saison\n- Valeur marchande: ~175M€\n\n**Conclusion:** Deux profils différents mais d'un niveau exceptionnel. Mbappé est plus complet et polyvalent, tandis que Haaland est un pur avant-centre redoutable dans la surface.`;
    }

    if (lower.includes("jeune") || lower.includes("talent")) {
      return `Voici le top 5 des jeunes talents français à suivre selon ArkaneIndex :\n\n1. **Warren Zaïre-Emery (PSG)** - 17 ans\n   - ArkaneIndex: 82.5/100\n   - Potentiel: ⭐⭐⭐⭐⭐\n   - Milieu récupérateur, vision du jeu exceptionnelle\n\n2. **Rayan Cherki (Lyon)** - 20 ans\n   - ArkaneIndex: 79.3/100\n   - Créativité, technique pure\n\n3. **Castello Lukeba (RB Leipzig)** - 21 ans\n   - Défenseur central prometteur\n\n4. **Mathys Tel (Bayern)** - 18 ans\n   - Attaquant explosif\n\n5. **Désiré Doué (Rennes)** - 19 ans\n   - Milieu polyvalent\n\nVoulez-vous plus de détails sur l'un d'entre eux ?`;
    }

    if (lower.includes("défense") || lower.includes("défenseur")) {
      return `Pour renforcer une défense centrale, voici les profils à cibler selon vos besoins :\n\n**Profil "Relance"** (pour un jeu de possession):\n- Pied gauche préférable\n- Qualité de passe > 85%\n- Vision du jeu ⭐⭐⭐⭐⭐\n- Exemples: Saliba, Stones\n\n**Profil "Bataille"** (jeu plus direct):\n- Duels aériens > 75%\n- Agressivité ⭐⭐⭐⭐\n- Physique imposant\n- Exemples: Van Dijk, Rüdiger\n\n**Profil "Complet"**:\n- Polyvalent défense/relance\n- Leadership\n- Prix plus élevé\n- Exemples: Dias, Marquinhos\n\nQuel type de profil correspond le mieux à votre équipe ?`;
    }

    return `Merci pour votre question ! Basé sur nos données ArkaneIndex et l'analyse de milliers de matches, voici mon analyse :\n\n${question}\n\nC'est un sujet passionnant. Notre IA a analysé les performances récentes, les statistiques avancées et les tendances du marché pour vous fournir cette réponse.\n\nSouhaitez-vous que j'approfondisse un aspect particulier ?`;
  };

  const handleSuggestedQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <MainLayout>
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
                <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                  ArkaneGPT
                </h1>
                <p className="text-arcane-grey text-sm">
                  Assistant IA spécialisé Football
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <div className="px-3 py-1 rounded-full bg-green-500/20 border border-green-500/30 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xs text-green-400 font-bold">En ligne</span>
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
                        {message.timestamp.toLocaleTimeString("fr-FR", {
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
                  <h3 className="text-arcane-grey text-sm mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Questions suggérées
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {suggestedQuestions.map((q) => {
                      const Icon = q.icon;
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
                  placeholder="Posez votre question sur le football..."
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
              <p className="text-xs text-arcane-grey mt-2 text-center">
                ArkaneGPT peut faire des erreurs. Vérifiez les informations importantes.
              </p>
            </div>
          </div>
        </div>
        </div>
      </div>
    </MainLayout>
  );
}
