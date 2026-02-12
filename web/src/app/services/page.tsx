"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { GradientText, NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import Link from "next/link";
import { ArrowLeft, Target, Users, TrendingUp, Award, Zap, Sparkles, Shield, Globe, Briefcase, Heart, ArrowRight, CheckCircle } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";
import { useLanguage } from "@/contexts/language-context";

const serviceIconMap = {
  target: Target,
  users: Users,
  trendingUp: TrendingUp,
  award: Award,
  zap: Zap,
  sparkles: Sparkles,
} as const;

const processIconMap = {
  heart: Heart,
  target: Target,
  shield: Shield,
  zap: Zap,
} as const;

export default function ServicesPage() {
  const { dictionary } = useLanguage();
  const navigationCopy = dictionary.common.navigation;
  const servicesCopy = dictionary.servicesPage;
  const offerings = servicesCopy.offerings.map((service) => ({
    ...service,
    Icon: serviceIconMap[service.icon as keyof typeof serviceIconMap] ?? Target,
  }));
  const processSteps = servicesCopy.process.steps.map((step) => ({
    ...step,
    Icon: processIconMap[step.icon as keyof typeof processIconMap] ?? Target,
  }));

  return (
    <main className="min-h-screen overflow-hidden relative">
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-arcane-darkBorder/50 bg-arcane-dark/90 backdrop-blur-xl">
        <div className="container-arcane">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <ArrowLeft className="h-5 w-5 text-arcane-accent group-hover:-translate-x-1 transition-transform" />
              <span className="text-arcane-grey group-hover:text-white transition-colors">
                {navigationCopy.backHome}
              </span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-arcane-accent flex items-center justify-center">
                <span className="text-arcane-dark font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
            </div>

            <Link href="/contact">
              <Button data-test="services-nav-cta">{servicesCopy.navCta}</Button>
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
              <span
                className="text-sm uppercase tracking-widest text-arcane-accent font-bold px-4 py-2 rounded-full border border-arcane-accent/30 bg-arcane-accent/5"
                data-test="services-hero-badge"
              >
                {servicesCopy.hero.eyebrow}
              </span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6" data-test="services-hero-title">
              <GradientText>{servicesCopy.hero.title}</GradientText>
            </h1>
              <p
                className="text-2xl md:text-3xl text-arcane-grey max-w-4xl mx-auto leading-relaxed"
                data-test="services-hero-description"
              >
                {servicesCopy.hero.description}
              </p>
          </motion.div>

          {/* Services Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-32"
          >
            {offerings.map((service, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card3D>
                  <GlassCard variant="elevated" glowOnHover className="h-full p-8 group cursor-pointer">
                    {/* Gradient Background */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-lg`} />

                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="w-16 h-16 rounded-xl bg-arcane-accent/10 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <service.Icon className="h-8 w-8 text-arcane-accent" />
                      </div>

                      {/* Title */}
                      <h3 className="text-3xl font-black text-white mb-4 uppercase group-hover:text-arcane-accent transition-colors">
                        {service.title}
                      </h3>

                      {/* Description */}
                      <p className="text-arcane-grey mb-6 group-hover:text-white transition-colors">
                        {service.description}
                      </p>

                      {/* Features */}
                      <ul className="space-y-3">
                        {service.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-arcane-accent mt-0.5 flex-shrink-0" />
                            <span className="text-arcane-grey group-hover:text-white transition-colors">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </GlassCard>
                </Card3D>
              </motion.div>
            ))}
          </motion.div>

          {/* Process Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl lg:text-7xl font-black mb-4">
                {servicesCopy.process.title.toUpperCase()}{" "}
                <NeonText>{servicesCopy.process.highlight.toUpperCase()}</NeonText>
              </h2>
              <p
                className="text-xl text-arcane-grey max-w-2xl mx-auto"
                data-test="services-process-subtitle"
              >
                {servicesCopy.process.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps.map((process, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card3D>
                    <GlassCard variant="bordered" className="h-full p-6 text-center">
                      {/* Step Number */}
                      <div className="text-6xl font-black mb-4">
                        <NeonText>{process.step}</NeonText>
                      </div>

                      {/* Icon */}
                      <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mx-auto mb-4">
                        <process.Icon className="h-6 w-6 text-arcane-accent" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-bold text-white mb-3 uppercase">
                        {process.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-arcane-grey">
                        {process.description}
                      </p>
                    </GlassCard>
                  </Card3D>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <GlassCard variant="elevated" className="p-12 md:p-16">
              <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black mb-4">
                  <GradientText>{servicesCopy.stats.title.toUpperCase()}</GradientText>
                </h2>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {servicesCopy.stats.items.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl md:text-5xl font-black mb-2">
                      <NeonText>{stat.value}</NeonText>
                    </div>
                    <div className="text-sm text-arcane-grey uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* CTA Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GlassCard variant="elevated" className="p-12 md:p-16 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-96 h-96 bg-arcane-accent/10 rounded-full blur-[150px]" />

              <div className="relative z-10">
                <Globe className="h-16 w-16 text-arcane-accent mx-auto mb-6" />
                <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase">
                  {servicesCopy.cta.title} <NeonText>{servicesCopy.cta.highlight}</NeonText>{" "}
                  {servicesCopy.cta.suffix}
                </h2>
                <p className="text-xl text-arcane-grey mb-8 max-w-2xl mx-auto">
                  {servicesCopy.cta.description}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/membership">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="lg"
                        className="shadow-[0_0_30px_rgba(228,255,59,0.4)]"
                        data-test="services-cta-membership"
                      >
                        <Sparkles className="mr-2 h-5 w-5" />
                        {servicesCopy.cta.buttons.membership}
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/reports/templates">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="lg"
                        variant="outline"
                        className="border-arcane-accent/40 text-arcane-accent hover:bg-arcane-accent/10"
                        data-test="services-cta-templates"
                      >
                        <CheckCircle className="mr-2 h-5 w-5" />
                        {servicesCopy.cta.buttons.templates}
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/contact">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="lg"
                        variant="secondary"
                        data-test="services-cta-consultation"
                      >
                        <Briefcase className="mr-2 h-5 w-5" />
                        {servicesCopy.cta.buttons.consultation}
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
