"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import Link from "next/link";
import { ArrowLeft, Check, Zap, Users, Trophy, Crown, Sparkles, ArrowRight } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";

const plans = [
  {
    name: "Player",
    icon: Users,
    price: "€2,500",
    period: "/month",
    description: "For individual players looking to advance their career",
    features: [
      "Personal agent 24/7",
      "Contract negotiation",
      "Career strategy planning",
      "Performance analytics",
      "Brand building support",
      "Social media management",
      "Legal assistance",
      "Financial advisory",
    ],
    highlighted: false,
  },
  {
    name: "Elite",
    icon: Crown,
    price: "€5,000",
    period: "/month",
    description: "For top-tier professionals seeking premium representation",
    features: [
      "Everything in Player",
      "Priority support",
      "Dedicated team of experts",
      "Global network access",
      "Transfer strategy",
      "Media training",
      "Personal branding campaigns",
      "Endorsement deals",
      "Tax optimization",
      "Family support services",
    ],
    highlighted: true,
  },
  {
    name: "Club",
    icon: Trophy,
    price: "Custom",
    period: "",
    description: "For football clubs and organizations",
    features: [
      "Dedicated account manager",
      "Player scouting network",
      "Transfer market intelligence",
      "Contract management",
      "Data analytics platform",
      "Youth academy support",
      "International partnerships",
      "Custom solutions",
    ],
    highlighted: false,
  },
];

export default function MembershipPage() {
  return (
    <main className="min-h-screen overflow-hidden relative">
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl">
        <div className="container-arcane">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <ArrowLeft className="h-5 w-5 text-arcane-accent group-hover:-translate-x-1 transition-transform" />
              <span className="text-arcane-grey group-hover:text-white transition-colors">Back to Home</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-arcane-accent flex items-center justify-center">
                <span className="text-arcane-dark font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
            </div>

            <Link href="/dashboard">
              <Button>Dashboard</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20">
        <div className="container-arcane relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-20"
          >
            <motion.div className="inline-block mb-6">
              <span className="text-sm uppercase tracking-widest text-arcane-accent font-bold px-4 py-2 rounded-full border border-arcane-accent/30 bg-arcane-accent/5">
                Membership Plans
              </span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl font-black mb-6">
              CHOOSE YOUR <NeonText>LEVEL</NeonText>
            </h1>
            <p className="text-2xl text-arcane-grey max-w-3xl mx-auto">
              Unlock <span className="text-white font-bold">premium representation</span> and elevate your career
            </p>
          </motion.div>

          {/* Pricing Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto"
          >
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                variants={staggerItem}
                className={plan.highlighted ? "lg:scale-110 lg:z-10" : ""}
              >
                <Card3D>
                  <GlassCard
                    variant={plan.highlighted ? "elevated" : "bordered"}
                    glowOnHover
                    className={`h-full relative ${plan.highlighted ? "border-2 border-arcane-accent/50" : ""}`}
                  >
                    {plan.highlighted && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <motion.div
                          className="px-6 py-2 rounded-full bg-arcane-accent text-arcane-dark font-black uppercase text-sm flex items-center gap-2"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <Sparkles className="h-4 w-4" />
                          Most Popular
                        </motion.div>
                      </div>
                    )}

                    <div className="p-8">
                      {/* Icon */}
                      <div className="mb-6">
                        <div className="w-16 h-16 rounded-xl bg-arcane-accent/10 flex items-center justify-center mb-4">
                          <plan.icon className="h-8 w-8 text-arcane-accent" />
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase mb-2">
                          {plan.name}
                        </h3>
                        <p className="text-arcane-grey text-sm">
                          {plan.description}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                          <span className="text-5xl font-black">
                            <NeonText>{plan.price}</NeonText>
                          </span>
                          {plan.period && (
                            <span className="text-arcane-grey text-lg">{plan.period}</span>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      <div className="space-y-3 mb-8">
                        {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="mt-1">
                              <Check className="h-5 w-5 text-arcane-accent" />
                            </div>
                            <span className="text-arcane-grey group-hover:text-white transition-colors">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          className={`w-full ${plan.highlighted ? "shadow-[0_0_30px_rgba(228,255,59,0.4)]" : ""}`}
                          variant={plan.highlighted ? "default" : "secondary"}
                        >
                          {plan.name === "Club" ? "Contact Sales" : "Get Started"}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </motion.div>
                    </div>
                  </GlassCard>
                </Card3D>
              </motion.div>
            ))}
          </motion.div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20 text-center"
          >
            <GlassCard variant="elevated" className="max-w-4xl mx-auto p-12">
              <Zap className="h-12 w-12 text-arcane-accent mx-auto mb-6" />
              <h3 className="text-3xl font-black text-white mb-4 uppercase">
                Need a Custom Solution?
              </h3>
              <p className="text-xl text-arcane-grey mb-8 max-w-2xl mx-auto">
                We offer tailored packages for agencies, academies, and special requirements.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="shadow-[0_0_30px_rgba(228,255,59,0.4)]">
                  Schedule Consultation
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
