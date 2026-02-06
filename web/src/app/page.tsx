"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { InfiniteMarquee, LogoItem } from "@/components/ui/infinite-marquee";
import { GradientText, NeonText } from "@/components/ui/gradient-text";
import { Card3D } from "@/components/ui/card-3d";
import { useAuth } from "@/contexts/auth-context";
import { useLanguage } from "@/contexts/language-context";
import Link from "next/link";
import { ArrowRight, Zap, Target, TrendingUp, Users, Award, ChevronDown, Play, Sparkles, Trophy, Shield, User } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { fadeInUp, staggerContainer, staggerItem, scrollReveal } from "@/lib/design-system/animations";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const { dictionary } = useLanguage();
  const t = dictionary.home;
  const [isScrolled, setIsScrolled] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: targetRef,
    offset: ["start start", "end start"],
  });

  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 0.8]);

  // Detect scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Mapping icons to stats
  const statsWithIcons = t.hero.stats.map((stat, index) => ({
    ...stat,
    icon: index === 0 ? Users : index === 1 ? Trophy : Shield
  }));

  return (
    <main className="min-h-screen overflow-hidden relative">
      {/* Background animé avec particules */}
      <AnimatedBackground />

      {/* Navigation - Premium avec blur dynamique */}
      <motion.nav
        initial={{ y: -100 }}
        animate={{
          y: 0,
          backgroundColor: isScrolled ? "rgba(8, 12, 29, 0.9)" : "rgba(8, 12, 29, 0)",
          backdropFilter: isScrolled ? "blur(16px)" : "blur(0px)",
          borderBottomColor: isScrolled ? "rgba(27, 33, 51, 0.5)" : "rgba(27, 33, 51, 0)",
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b"
      >
        <div className="container-arcane">
          <div className="flex h-20 items-center justify-between">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-3"
            >
              <div className="h-10 w-10 rounded-lg bg-arcane-accent flex items-center justify-center">
                <span className="text-arcane-dark font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden md:flex items-center gap-8"
            >
              <Link href="/players" className="text-arcane-grey hover:text-arcane-accent transition-colors font-medium">
                {t.nav.players}
              </Link>
              <Link href="/services" className="text-arcane-grey hover:text-arcane-accent transition-colors font-medium">
                {t.nav.services}
              </Link>
              <Link href="/about" className="text-arcane-grey hover:text-arcane-accent transition-colors font-medium">
                {t.nav.about}
              </Link>
              <Link href="/contact" className="text-arcane-grey hover:text-arcane-accent transition-colors font-medium">
                {t.nav.contact}
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3"
            >
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="secondary" size="sm" className="hidden lg:flex">
                      {t.nav.dashboard}
                    </Button>
                  </Link>
                  <Link href="/dashboard">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-arcane-accent/10 border border-arcane-accent/30 hover:border-arcane-accent transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-arcane-accent flex items-center justify-center">
                        <User className="h-4 w-4 text-arcane-dark" />
                      </div>
                      <span className="text-white font-medium hidden sm:inline">{user?.fullName || "User"}</span>
                    </motion.div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="secondary" size="sm">
                      {t.nav.login}
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="group">
                      {t.nav.getStarted}
                      <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section - 120K ULTRA PREMIUM */}
      <section ref={targetRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        <motion.div
          style={{ opacity, scale }}
          className="relative z-10 text-center px-6 max-w-7xl mx-auto"
        >
          {/* Badge Premium avec Sparkles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-arcane-accent/30 bg-arcane-accent/10 backdrop-blur-sm mb-12 group hover:border-arcane-accent/50 transition-all"
          >
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="h-5 w-5 text-arcane-accent" />
            </motion.div>
            <span className="text-base text-arcane-accent font-bold uppercase tracking-wider">
              {t.hero.badge}
            </span>
          </motion.div>

          {/* Main Headline avec Gradient Animé */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
          >
            <h1 className="text-7xl md:text-9xl lg:text-[12rem] font-black mb-8 leading-[0.9] tracking-tighter">
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <GradientText animated className="block">
                  {t.hero.title.line1}
                </GradientText>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <NeonText className="block">
                  {t.hero.title.line2}
                </NeonText>
              </motion.div>
            </h1>
          </motion.div>

          {/* Subtitle avec mise en avant */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className="text-2xl md:text-3xl lg:text-4xl text-arcane-grey max-w-4xl mx-auto mb-16 leading-relaxed font-light"
          >
            {t.hero.subtitle.through}{" "}
            <span className="text-white font-bold relative inline-block">
              {t.hero.subtitle.performance}
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-arcane-accent/30 blur-sm" />
            </span>
            ,{" "}
            <span className="text-white font-bold relative inline-block">
              {t.hero.subtitle.precision}
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-arcane-accent/30 blur-sm" />
            </span>{" "}
            {t.hero.subtitle.and}{" "}
            <span className="text-arcane-accent font-bold relative inline-block">
              {t.hero.subtitle.ambition}
              <span className="absolute -bottom-1 left-0 w-full h-1 bg-arcane-accent blur-sm" />
            </span>
          </motion.p>

          {/* CTA Buttons Premium */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-24"
          >
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button size="lg" className="group text-xl px-12 py-8 rounded-full shadow-[0_0_40px_rgba(228,255,59,0.4)] hover:shadow-[0_0_60px_rgba(228,255,59,0.6)] transition-all">
                <Zap className="mr-3 h-6 w-6" />
                {t.hero.cta.startJourney}
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button size="lg" variant="secondary" className="text-xl px-12 py-8 rounded-full backdrop-blur-md">
                <Play className="mr-3 h-6 w-6" />
                {t.hero.cta.watchVideo}
              </Button>
            </motion.div>
          </motion.div>

          {/* Stats Premium en 3D Cards */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto"
          >
            {statsWithIcons.map((stat, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card3D>
                  <GlassCard variant="elevated" glowOnHover className="text-center p-8 cursor-pointer">
                    <stat.icon className="h-12 w-12 text-arcane-accent mx-auto mb-4" />
                    <div className="text-5xl md:text-6xl font-black mb-2 tabular-nums">
                      <NeonText>
                        <AnimatedCounter
                          to={stat.value}
                          suffix={stat.suffix}
                          duration={2.5}
                        />
                      </NeonText>
                    </div>
                    <div className="text-base text-arcane-grey uppercase tracking-widest font-bold">
                      {stat.label}
                    </div>
                  </GlassCard>
                </Card3D>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, 10, 0] }}
            transition={{ delay: 1.5, y: { repeat: Infinity, duration: 2, ease: "easeInOut" } }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs text-arcane-grey uppercase tracking-wider">{t.hero.scroll}</span>
              <ChevronDown className="h-8 w-8 text-arcane-accent" />
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Bento Grid Section - Services PREMIUM */}
      <section id="services" className="section-dark py-32 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-arcane-accent/5 rounded-full blur-[150px]" />

        <div className="container-arcane relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-6"
            >
              <span className="text-sm uppercase tracking-widest text-arcane-accent font-bold px-4 py-2 rounded-full border border-arcane-accent/30 bg-arcane-accent/5">
                {t.services.badge}
              </span>
            </motion.div>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6">
              <GradientText>{t.services.title}</GradientText>
            </h2>
            <p className="text-2xl text-arcane-grey max-w-3xl mx-auto leading-relaxed">
              {t.services.subtitle}
            </p>
          </motion.div>

          {/* Bento Grid Layout Premium */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[280px]">
            {/* Large featured card - Player Management */}
            <motion.div
              variants={scrollReveal}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-100px" }}
              className="md:col-span-3 md:row-span-2"
            >
              <Card3D className="h-full">
                <GlassCard variant="elevated" glowOnHover className="h-full relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-arcane-accent/10 rounded-full blur-3xl" />
                  <div className="relative z-10 h-full flex flex-col justify-between p-8">
                    <div>
                      <Target className="h-16 w-16 text-arcane-accent mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" />
                      <h3 className="text-4xl font-black text-white mb-4 uppercase tracking-tight">
                        {t.services.items.playerManagement.title}
                      </h3>
                      <p className="text-lg text-arcane-grey leading-relaxed group-hover:text-white transition-colors">
                        {t.services.items.playerManagement.description}
                      </p>
                    </div>
                    <motion.div
                      className="flex items-center gap-2 text-arcane-accent font-bold"
                      whileHover={{ x: 5 }}
                    >
                      <span>{t.services.items.playerManagement.cta}</span>
                      <ArrowRight className="h-5 w-5" />
                    </motion.div>
                  </div>
                </GlassCard>
              </Card3D>
            </motion.div>

            {/* Scouting Network */}
            <motion.div
              variants={scrollReveal}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-100px" }}
              className="md:col-span-3"
            >
              <Card3D className="h-full">
                <GlassCard variant="bordered" glowOnHover className="h-full p-8">
                  <Users className="h-12 w-12 text-arcane-accent mb-4 group-hover:scale-110 transition-all" />
                  <h3 className="text-2xl font-bold text-white mb-3 uppercase">
                    {t.services.items.scoutingNetwork.title}
                  </h3>
                  <p className="text-arcane-grey group-hover:text-white transition-colors">
                    {t.services.items.scoutingNetwork.description}
                  </p>
                </GlassCard>
              </Card3D>
            </motion.div>

            {/* Performance Analytics */}
            <motion.div
              variants={scrollReveal}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-100px" }}
              className="md:col-span-2"
            >
              <Card3D className="h-full">
                <GlassCard variant="bordered" glowOnHover className="h-full p-8">
                  <TrendingUp className="h-12 w-12 text-arcane-accent mb-4 group-hover:scale-110 transition-all" />
                  <h3 className="text-2xl font-bold text-white mb-3 uppercase">
                    {t.services.items.performanceAnalytics.title}
                  </h3>
                  <p className="text-arcane-grey group-hover:text-white transition-colors">
                    {t.services.items.performanceAnalytics.description}
                  </p>
                </GlassCard>
              </Card3D>
            </motion.div>

            {/* Club Relations */}
            <motion.div
              variants={scrollReveal}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-100px" }}
              className="md:col-span-2"
            >
              <Card3D className="h-full">
                <GlassCard variant="bordered" glowOnHover className="h-full p-8">
                  <Award className="h-12 w-12 text-arcane-accent mb-4 group-hover:scale-110 transition-all" />
                  <h3 className="text-2xl font-bold text-white mb-3 uppercase">
                    {t.services.items.clubRelations.title}
                  </h3>
                  <p className="text-arcane-grey group-hover:text-white transition-colors">
                    {t.services.items.clubRelations.description}
                  </p>
                </GlassCard>
              </Card3D>
            </motion.div>

            {/* Transfer Strategy - Wide */}
            <motion.div
              variants={scrollReveal}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-100px" }}
              className="md:col-span-4"
            >
              <Card3D className="h-full">
                <GlassCard variant="elevated" glowOnHover className="h-full p-8 relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-96 h-96 bg-arcane-accent/5 rounded-full blur-3xl" />
                  <div className="relative z-10 flex items-center gap-8">
                    <Zap className="h-16 w-16 text-arcane-accent group-hover:scale-110 transition-all" />
                    <div>
                      <h3 className="text-3xl font-black text-white mb-2 uppercase">
                        {t.services.items.transferStrategy.title}
                      </h3>
                      <p className="text-lg text-arcane-grey group-hover:text-white transition-colors">
                        {t.services.items.transferStrategy.description}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </Card3D>
            </motion.div>

            {/* Brand Building */}
            <motion.div
              variants={scrollReveal}
              initial="initial"
              whileInView="whileInView"
              viewport={{ once: true, margin: "-100px" }}
              className="md:col-span-2"
            >
              <Card3D className="h-full">
                <GlassCard variant="bordered" glowOnHover className="h-full p-8">
                  <Sparkles className="h-12 w-12 text-arcane-accent mb-4 group-hover:scale-110 transition-all" />
                  <h3 className="text-2xl font-bold text-white mb-3 uppercase">
                    {t.services.items.brandBuilding.title}
                  </h3>
                  <p className="text-arcane-grey group-hover:text-white transition-colors">
                    {t.services.items.brandBuilding.description}
                  </p>
                </GlassCard>
              </Card3D>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Players Showcase - Premium Section */}
      <section className="section-dark-alt py-32 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-arcane-accent/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-arcane-accent/5 rounded-full blur-[150px]" />

        <div className="container-arcane relative z-10">
          <motion.div
            variants={scrollReveal}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="text-center mb-20"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-block mb-6"
            >
              <span className="text-sm uppercase tracking-widest text-arcane-accent font-bold px-4 py-2 rounded-full border border-arcane-accent/30 bg-arcane-accent/5">
                {t.players.badge}
              </span>
            </motion.div>
            <h2 className="text-6xl md:text-7xl lg:text-8xl font-black mb-6">
              {t.players.title.elite} <NeonText>{t.players.title.highlight}</NeonText>
            </h2>
            <p className="text-2xl text-arcane-grey max-w-3xl mx-auto leading-relaxed">
              {t.players.subtitle}
            </p>
          </motion.div>

          {/* Players Grid */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {t.players.mockPlayers.map((player, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card3D>
                  <GlassCard variant="elevated" glowOnHover className="group cursor-pointer">
                    {/* Player Image Placeholder */}
                    <div className="aspect-[3/4] bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder rounded-xl mb-6 relative overflow-hidden">
                      {/* Animated gradient overlay */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-arcane-accent/10 via-transparent to-arcane-accent/5"
                        animate={{
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      />

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-40 h-40 rounded-full bg-arcane-accent/10 flex items-center justify-center backdrop-blur-sm border border-arcane-accent/20">
                          <Users className="w-20 h-20 text-arcane-accent/50" />
                        </div>
                      </div>

                      {/* Rating Badge Premium */}
                      <motion.div
                        className="absolute top-4 right-4 w-20 h-20 rounded-full bg-arcane-accent backdrop-blur-sm flex items-center justify-center border-4 border-white/30 shadow-[0_0_20px_rgba(228,255,59,0.5)]"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                      >
                        <span className="text-arcane-dark font-black text-2xl">{player.rating}</span>
                      </motion.div>

                      {/* Overlay on hover avec effet premium */}
                      <div className="absolute inset-0 bg-gradient-to-t from-arcane-dark via-arcane-dark/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="absolute bottom-4 left-4 right-4">
                          <motion.div
                            className="flex items-center gap-2"
                            initial={{ y: 20, opacity: 0 }}
                            whileHover={{ y: 0, opacity: 1 }}
                          >
                            <Trophy className="h-5 w-5 text-arcane-accent" />
                            <span className="text-white font-bold text-sm">{t.players.performance}</span>
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Player Info Premium */}
                    <div className="space-y-3">
                      <h3 className="text-3xl font-black text-white group-hover:text-arcane-accent transition-colors uppercase">
                        {player.name}
                      </h3>
                      <p className="text-arcane-accent uppercase text-sm tracking-widest font-bold">
                        {player.position}
                      </p>
                      <div className="flex items-center gap-3 pt-2 pb-4">
                        <motion.div
                          className="w-3 h-3 rounded-full bg-arcane-accent"
                          animate={{
                            scale: [1, 1.3, 1],
                            opacity: [1, 0.5, 1],
                          }}
                          transition={{
                            duration: 2,
                            repeat: Infinity,
                          }}
                        />
                        <span className="text-base text-white font-semibold">{player.club}</span>
                      </div>
                    </div>

                    {/* Action button on hover Premium */}
                    <motion.div
                      className="mt-4 opacity-0 group-hover:opacity-100 transition-all duration-300"
                      initial={{ y: 10 }}
                      whileHover={{ y: 0 }}
                    >
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button variant="default" className="w-full group/btn shadow-[0_0_20px_rgba(228,255,59,0.3)]">
                          <Users className="mr-2 h-4 w-4" />
                          {t.players.viewProfile}
                          <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </motion.div>
                    </motion.div>
                  </GlassCard>
                </Card3D>
              </motion.div>
            ))}
          </motion.div>

          {/* View All Link */}
          <motion.div
            variants={fadeInUp}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="text-center mt-16"
          >
            <Link href="/players" className="inline-flex items-center gap-2 text-arcane-accent hover:text-white transition-colors text-lg font-medium group">
              {t.players.viewAll}
              <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - Ultra Premium */}
      <section className="section-dark py-32 relative overflow-hidden">
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-arcane-accent/10 rounded-full blur-[150px]"
          animate={{
            y: [0, 50, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-arcane-accent/5 rounded-full blur-[150px]"
          animate={{
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        <div className="container-arcane relative z-10">
          <motion.div
            variants={scrollReveal}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="relative"
          >
            {/* Main CTA Card */}
            <GlassCard variant="elevated" className="max-w-4xl mx-auto text-center p-16 md:p-20">
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-arcane-accent/10 border border-arcane-accent/30 mb-8"
              >
                <Zap className="h-4 w-4 text-arcane-accent" />
                <span className="text-sm font-medium text-arcane-accent uppercase tracking-wide">
                  {t.cta.badge}
                </span>
              </motion.div>

              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-5xl md:text-7xl font-bold mb-6 uppercase tracking-wide"
              >
                <span className="text-white">{t.cta.title.ready}</span>
                <br />
                <span className="text-arcane-accent">{t.cta.title.elevate}</span>
              </motion.h2>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-xl md:text-2xl text-arcane-grey max-w-2xl mx-auto mb-12 leading-relaxed"
              >
                {t.cta.subtitle.join} <span className="text-white font-semibold">{t.cta.subtitle.network}</span> {t.cta.subtitle.trust}{" "}
                <span className="text-arcane-accent font-semibold">{t.cta.subtitle.arcane}</span>
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 justify-center items-center"
              >
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="text-lg px-12 py-6 group shadow-[0_0_30px_rgba(228,255,59,0.3)]">
                    {t.cta.buttons.getStarted}
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Button>
                </motion.div>

                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="secondary" className="text-lg px-12 py-6 group">
                    <Play className="mr-2 h-5 w-5" />
                    {t.cta.buttons.watchVideo}
                  </Button>
                </motion.div>
              </motion.div>

              {/* Trust indicators */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="mt-16 pt-12 border-t border-arcane-darkBorder/50"
              >
                <p className="text-sm text-arcane-grey uppercase tracking-wider mb-6">
                  {t.cta.trusted.title}
                </p>
                <div className="flex flex-wrap justify-center gap-8 items-center">
                  {t.cta.trusted.clubs.map((club, i) => (
                    <div
                      key={i}
                      className="text-arcane-grey hover:text-white transition-colors font-medium text-sm md:text-base"
                    >
                      {club}
                    </div>
                  ))}
                </div>
              </motion.div>
            </GlassCard>
          </motion.div>
        </div>
      </section>

      {/* Marquee Section - Trusted Partners */}
      <section className="section-dark py-24 border-y border-arcane-darkBorder/40">
        <div className="container-arcane mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <h3 className="text-lg uppercase tracking-widest text-arcane-grey mb-2 font-bold">
              {t.partners.title.trusted}
            </h3>
            <p className="text-4xl md:text-5xl font-black">
              <GradientText>{t.partners.title.elite}</GradientText>
            </p>
          </motion.div>
        </div>

        <div className="space-y-8">
          {/* First row */}
          <InfiniteMarquee speed={40} direction="left">
            {t.partners.clubs.slice(0, 8).map((club) => (
              <LogoItem key={club} name={club} />
            ))}
          </InfiniteMarquee>

          {/* Second row */}
          <InfiniteMarquee speed={45} direction="right">
            {t.partners.clubs.slice(8, 16).map((club) => (
              <LogoItem key={club} name={club} />
            ))}
          </InfiniteMarquee>
        </div>
      </section>

      {/* Footer */}
      <footer className="section-dark border-t border-arcane-darkBorder/40 py-16">
        <div className="container-arcane">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-lg bg-arcane-accent flex items-center justify-center">
                  <span className="text-arcane-dark font-bold text-xl">A</span>
                </div>
                <span className="text-2xl font-bold text-white">ARCANE</span>
              </div>
              <p className="text-arcane-grey text-sm leading-relaxed">
                {t.footer.tagline}
              </p>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wide">{t.footer.sections.services.title}</h4>
              <ul className="space-y-2">
                {t.footer.sections.services.items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-arcane-grey hover:text-arcane-accent transition-colors text-sm">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wide">{t.footer.sections.company.title}</h4>
              <ul className="space-y-2">
                {t.footer.sections.company.items.map((item) => (
                  <li key={item}>
                    <Link href="#" className="text-arcane-grey hover:text-arcane-accent transition-colors text-sm">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-4 uppercase tracking-wide">{t.footer.sections.connect.title}</h4>
              <div className="space-y-2">
                <a href="https://www.arcane.li" className="block text-arcane-grey hover:text-arcane-accent transition-colors text-sm">
                  www.arcane.li
                </a>
                <a href="https://instagram.com/arcanegmbh" className="block text-arcane-grey hover:text-arcane-accent transition-colors text-sm">
                  @arcanegmbh
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-arcane-darkBorder/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-arcane-grey text-sm">
              {t.footer.copyright}
            </p>
            <div className="flex gap-6">
              <Link href="/brand-preview" className="text-arcane-grey hover:text-arcane-accent transition-colors text-sm">
                {t.footer.links.brand}
              </Link>
              <Link href="#" className="text-arcane-grey hover:text-arcane-accent transition-colors text-sm">
                {t.footer.links.privacy}
              </Link>
              <Link href="#" className="text-arcane-grey hover:text-arcane-accent transition-colors text-sm">
                {t.footer.links.terms}
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}