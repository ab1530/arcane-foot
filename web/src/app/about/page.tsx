"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { GradientText, NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { AnimatedCounter } from "@/components/ui/animated-counter";
import Link from "next/link";
import { ArrowLeft, Target, Users, Globe, Award, Linkedin, Twitter, Mail } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/design-system/animations";
import { useLanguage } from "@/contexts/language-context";

const valueIconMap = {
  excellence: Target,
  integrity: Users,
  global: Globe,
  innovation: Award,
} as const;

export default function AboutPage() {
  const { dictionary } = useLanguage();
  const aboutCopy = dictionary.about;
  const navigationCopy = dictionary.common.navigation;

  const stats = aboutCopy.stats;
  const values = aboutCopy.values.map((value) => ({
    ...value,
    icon: valueIconMap[value.id as keyof typeof valueIconMap] ?? Target,
  }));
  const teamMembers = aboutCopy.team.members;

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
              <Button>{navigationCopy.contact}</Button>
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
                {aboutCopy.hero.eyebrow}
              </span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6">
              <GradientText>{aboutCopy.hero.title}</GradientText>
            </h1>
            <p className="text-2xl md:text-3xl text-arcane-grey max-w-4xl mx-auto leading-relaxed">
              {aboutCopy.hero.description.before}{" "}
              <span className="text-white font-bold">{aboutCopy.hero.description.highlight}</span>{" "}
              {aboutCopy.hero.description.after}
            </p>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-32"
          >
            {stats.map((stat, index) => (
              <motion.div key={index} variants={staggerItem}>
                <Card3D>
                  <GlassCard variant="elevated" className="text-center p-6">
                    <div className="text-5xl font-black mb-2">
                      <NeonText>
                        <AnimatedCounter to={stat.value} suffix={stat.suffix} duration={2.5} />
                      </NeonText>
                    </div>
                    <div className="text-sm text-arcane-grey uppercase tracking-wider">
                      {stat.label}
                    </div>
                  </GlassCard>
                </Card3D>
              </motion.div>
            ))}
          </motion.div>

          {/* Our Story */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-5xl md:text-6xl font-black mb-6 uppercase">
                  {aboutCopy.story.title} <NeonText>{aboutCopy.story.highlight}</NeonText>
                </h2>
                <div className="space-y-4 text-lg text-arcane-grey">
                  {aboutCopy.story.paragraphs.map((paragraph) => (
                    <p
                      key={paragraph.id}
                      className={`text-lg ${
                        paragraph.emphasize ? "text-white font-semibold" : "text-arcane-grey"
                      }`}
                    >
                      {paragraph.text}
                    </p>
                  ))}
                </div>
              </div>

              <Card3D>
                <GlassCard variant="elevated" className="p-12">
                  <div className="aspect-video bg-gradient-to-br from-arcane-darkBorder via-arcane-dark to-arcane-darkBorder rounded-lg flex items-center justify-center">
                    <Globe className="h-32 w-32 text-arcane-accent/30" />
                  </div>
                </GlassCard>
              </Card3D>
            </div>
          </motion.div>

          {/* Our Values */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black mb-4 uppercase">
                {aboutCopy.valuesSection.title} <NeonText>{aboutCopy.valuesSection.highlight}</NeonText>
              </h2>
              <p className="text-xl text-arcane-grey max-w-2xl mx-auto">
                {aboutCopy.valuesSection.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const Icon = value.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card3D>
                      <GlassCard variant="bordered" glowOnHover className="h-full p-6 text-center group cursor-pointer">
                        <div className="w-16 h-16 rounded-xl bg-arcane-accent/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                          <Icon className="h-8 w-8 text-arcane-accent" />
                        </div>
                        <h3 className="text-xl font-black text-white mb-3 uppercase">
                          {value.title}
                        </h3>
                        <p className="text-sm text-arcane-grey group-hover:text-white transition-colors">
                          {value.description}
                        </p>
                      </GlassCard>
                    </Card3D>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Team */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-32"
          >
            <div className="text-center mb-16">
              <h2 className="text-5xl md:text-6xl font-black mb-4 uppercase">
                {aboutCopy.team.title} <NeonText>{aboutCopy.team.highlight}</NeonText>
              </h2>
              <p className="text-xl text-arcane-grey max-w-2xl mx-auto">
                {aboutCopy.team.subtitle}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card3D>
                    <GlassCard variant="elevated" glowOnHover className="p-6 group cursor-pointer">
                      {/* Photo Placeholder */}
                      <div className="aspect-square bg-gradient-to-br from-arcane-darkBorder to-arcane-dark rounded-lg mb-4 flex items-center justify-center">
                        <Users className="h-16 w-16 text-arcane-accent/30" />
                      </div>

                      {/* Info */}
                      <h3 className="text-xl font-black text-white mb-1 group-hover:text-arcane-accent transition-colors">
                        {member.name}
                      </h3>
                      <p className="text-sm text-arcane-accent font-bold uppercase tracking-wide mb-3">
                        {member.role}
                      </p>
                      <p className="text-sm text-arcane-grey mb-4">
                        {member.bio}
                      </p>

                      {/* Social Links */}
                      <div className="flex gap-3">
                        <a
                          href={member.linkedin}
                          className="w-8 h-8 rounded-full bg-arcane-darkBorder/50 flex items-center justify-center hover:bg-arcane-accent/20 transition-colors"
                        >
                          <Linkedin className="h-4 w-4 text-arcane-grey hover:text-arcane-accent transition-colors" />
                        </a>
                        <a
                          href={member.twitter}
                          className="w-8 h-8 rounded-full bg-arcane-darkBorder/50 flex items-center justify-center hover:bg-arcane-accent/20 transition-colors"
                        >
                          <Twitter className="h-4 w-4 text-arcane-grey hover:text-arcane-accent transition-colors" />
                        </a>
                      </div>
                    </GlassCard>
                  </Card3D>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <GlassCard variant="elevated" className="p-12 md:p-16 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase">
                {aboutCopy.cta.title} <NeonText>{aboutCopy.cta.highlight}</NeonText>
                {aboutCopy.cta.suffix ? (
                  <>
                    {" "}
                    {aboutCopy.cta.suffix}
                  </>
                ) : null}
              </h2>
              <p className="text-xl text-arcane-grey mb-8 max-w-2xl mx-auto">
                {aboutCopy.cta.description}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/membership">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="shadow-[0_0_30px_rgba(228,255,59,0.4)]">
                      {aboutCopy.cta.buttons.membership}
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/contact">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" variant="secondary">
                      <Mail className="mr-2 h-5 w-5" />
                      {aboutCopy.cta.buttons.contact}
                    </Button>
                  </motion.div>
                </Link>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
