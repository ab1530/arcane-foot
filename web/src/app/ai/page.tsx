"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  MessageSquare,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Target,
  TrendingUp,
  Users,
  CheckCircle,
  Crown,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { useSubscription, type SubscriptionTier } from "@/hooks/useSubscription";
import MainLayout from "@/components/layout/MainLayout";
import { ProtectedPage } from "@/components/guards/ProtectedPage";
import { RequireTier } from "@/components/auth/RequireTier";
import { useLanguage } from "@/contexts/language-context";
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

const featureIconMap = {
  brain: Brain,
  message: MessageSquare,
  file: FileText,
} as const;

const benefitIconMap = {
  zap: Zap,
  target: Target,
  trending: TrendingUp,
  users: Users,
} as const;

export default function AIHubPage() {
  const router = useRouter();
  const { hasMinimumTier, getTierName, subscription } = useSubscription();
  const { dictionary } = useLanguage();
  const { requireAccess } = useSubscriptionGuard();
  const aiCopy = dictionary.aiHub;

  const aiFeatures = aiCopy.features.map((feature) => ({
    ...feature,
    Icon: featureIconMap[feature.icon as keyof typeof featureIconMap] ?? Brain,
  }));

  const benefits = aiCopy.benefits.map((benefit) => ({
    ...benefit,
    Icon: benefitIconMap[benefit.icon as keyof typeof benefitIconMap] ?? Sparkles,
  }));

  const canAccessFeature = (minTier: string) => hasMinimumTier(minTier as SubscriptionTier);

  const handleFeatureAccess = (href: string, minTier: SubscriptionTier, featureName: string) => {
    if (!requireAccess(minTier, featureName)) {
      return;
    }
    router.push(href);
  };

  return (
    <MainLayout>
      <ProtectedPage>
        <RequireTier minTier="BASIC">
      <div className="min-h-screen overflow-hidden relative">
        <AnimatedBackground />

        <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arcane-accent/20 border border-arcane-accent/30 mb-6">
            <Sparkles className="h-4 w-4 text-arcane-accent" />
            <span className="text-arcane-accent font-bold text-sm" data-test="ai-hero-badge-text">
              {aiCopy.hero.eyebrow}
            </span>
          </div>

          <h1 className="text-6xl md:text-7xl font-black text-white mb-6 uppercase tracking-tight" data-test="ai-hero-title">
            {aiCopy.hero.title} <span className="text-arcane-accent">{aiCopy.hero.highlight}</span>
          </h1>

          <p className="text-xl text-arcane-grey max-w-3xl mx-auto mb-8">
            {aiCopy.hero.description}
          </p>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => router.push(aiCopy.hero.primaryCta.href)}
              className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
              size="lg"
            >
              <MessageSquare className="h-5 w-5 mr-2" />
              {aiCopy.hero.primaryCta.label}
            </Button>
            <Button variant="outline" size="lg" onClick={() => router.push(aiCopy.hero.secondaryCta.href)}>
              <FileText className="h-4 w-4 mr-2" />
              {aiCopy.hero.secondaryCta.label}
            </Button>
          </div>
        </motion.div>

        {/* AI Features Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16">
          {aiFeatures.map((feature, index) => {
            const IconComponent = feature.Icon;
            const minTier = feature.minTier as SubscriptionTier;
            const hasAccess = canAccessFeature(feature.minTier);
            const tierLabel = getTierName(minTier);

            return (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <GlassCard
                  variant="elevated"
                  className={`h-full overflow-hidden ${
                    !hasAccess ? "opacity-75" : ""
                  }`}
                >
                  {/* Header with gradient */}
                  <div
                    className={`h-32 bg-gradient-to-br ${feature.gradient} relative overflow-hidden`}
                  >
                    <div className="absolute inset-0 bg-black/30" />
                    <div className="relative z-10 p-6 flex items-center justify-between h-full">
                      <IconComponent className="h-16 w-16 text-white" />
                      {!hasAccess && (
                        <div className="px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center gap-2">
                          <Lock className="h-3 w-3 text-white" />
                          <span className="text-xs text-white font-bold">
                            {aiCopy.featuresCtas.lockedBadge.replace("{{tier}}", tierLabel)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-2xl font-black text-white mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-arcane-accent text-sm font-bold mb-3">
                      {feature.tagline}
                    </p>
                    <p className="text-arcane-grey text-sm mb-6">
                      {feature.description}
                    </p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-6 pb-6 border-b border-arcane-darkBorder">
                      {feature.stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                          <p className="text-white font-black text-lg">{stat.value}</p>
                          <p className="text-arcane-grey text-xs capitalize">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    {/* Features List */}
                    <div className="space-y-2 mb-6">
                      {feature.bullets.map((feat, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-arcane-accent flex-shrink-0 mt-0.5" />
                          <span className="text-sm text-arcane-grey">{feat}</span>
                        </div>
                      ))}
                    </div>

                    {/* CTA */}
                    <Button
                      onClick={() => handleFeatureAccess(feature.href, minTier, feature.name)}
                      className={`w-full ${hasAccess ? "bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80" : "border border-arcane-accent/30 text-arcane-accent hover:bg-arcane-accent/10"}`}
                      variant={hasAccess ? "default" : "outline"}
                    >
                      {hasAccess ? (
                        <>
                          {aiCopy.featuresCtas.access}
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      ) : (
                        <>
                          <Crown className="h-4 w-4 mr-2" />
                          {aiCopy.featuresCtas.upgrade.replace("{{tier}}", tierLabel)}
                        </>
                      )}
                    </Button>
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Benefits Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-16"
        >
          <h2 className="text-3xl font-black text-white mb-8 text-center uppercase tracking-tight">
            {aiCopy.benefitsTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.Icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <GlassCard className="p-6 text-center h-full">
                    <div className="h-12 w-12 rounded-full bg-arcane-accent/20 flex items-center justify-center mx-auto mb-4">
                      <Icon className="h-6 w-6 text-arcane-accent" />
                    </div>
                    <h3 className="text-white font-bold mb-2">{benefit.title}</h3>
                    <p className="text-arcane-grey text-sm">{benefit.description}</p>
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <GlassCard className="p-12 text-center bg-gradient-to-r from-arcane-accent/10 via-transparent to-arcane-accent/5 border-arcane-accent/30">
            <Sparkles className="h-12 w-12 text-arcane-accent mx-auto mb-4" />
            <h2 className="text-3xl font-black text-white mb-4">
              {aiCopy.cta.title}
            </h2>
            <p className="text-arcane-grey mb-8 max-w-2xl mx-auto">
              {aiCopy.cta.description}
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                onClick={() => router.push(aiCopy.cta.primary.href)}
                className="bg-arcane-accent text-arcane-dark hover:bg-arcane-accent/80"
                size="lg"
              >
                {aiCopy.cta.primary.label}
              </Button>
              <Button
                onClick={() => router.push(aiCopy.cta.secondary.href)}
                variant="outline"
                size="lg"
              >
                <Crown className="h-4 w-4 mr-2" />
                {aiCopy.cta.secondary.label}
              </Button>
            </div>

            {subscription && (
              <p className="text-xs text-arcane-grey mt-6">
                {aiCopy.cta.planLabel.replace("{{tier}}", getTierName(subscription.tier))}
              </p>
            )}
          </GlassCard>
        </motion.div>
        </div>
      </div>
        </RequireTier>
      </ProtectedPage>
    </MainLayout>
  );
}
