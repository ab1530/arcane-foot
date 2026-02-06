"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { GradientText, NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, MapPin, Send, Clock, Globe } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";
import { apiClient } from "@/lib/api-client";

export default function ContactPage() {
  const { dictionary } = useLanguage();
  const navigationCopy = dictionary.common.navigation;
  const contactCopy = dictionary.contact;
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "player",
    message: "",
    company: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.company.trim()) {
      toast.success(contactCopy.form.success.title, {
        description: contactCopy.form.success.description,
      });
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "player",
        message: "",
        company: "",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await apiClient.sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || undefined,
        type: formData.type,
        message: formData.message.trim(),
        company: formData.company.trim(),
      });

      toast.success(contactCopy.form.success.title, {
        description: contactCopy.form.success.description,
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        type: "player",
        message: "",
        company: "",
      });
    } catch (error) {
      toast.error(contactCopy.form.error.title, {
        description: contactCopy.form.error.description,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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

            <Link href="/services">
              <Button>{contactCopy.navCta}</Button>
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
                {contactCopy.hero.eyebrow}
              </span>
            </motion.div>
            <h1
              className="text-6xl md:text-8xl lg:text-9xl font-black mb-6"
              data-test="contact-hero-title"
            >
              <GradientText>{contactCopy.hero.title}</GradientText>
            </h1>
            <p className="text-2xl text-arcane-grey max-w-3xl mx-auto">
              {contactCopy.hero.description.before}{" "}
              <span className="text-white font-bold">{contactCopy.hero.description.highlight}</span>{" "}
              {contactCopy.hero.description.after}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1 space-y-6"
            >
              {/* Contact Cards */}
              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mb-4">
                    <Mail className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">
                    {contactCopy.info.email.title}
                  </h3>
                  <a
                    href={`mailto:${contactCopy.info.email.value}`}
                    className="text-arcane-grey hover:text-arcane-accent transition-colors"
                  >
                    {contactCopy.info.email.value}
                  </a>
                </GlassCard>
              </Card3D>

              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">
                    {contactCopy.info.phone.title}
                  </h3>
                  <a
                    href={`tel:${contactCopy.info.phone.value.replace(/\\s/g, "")}`}
                    className="text-arcane-grey hover:text-arcane-accent transition-colors"
                  >
                    {contactCopy.info.phone.value}
                  </a>
                </GlassCard>
              </Card3D>

              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">
                    {contactCopy.info.office.title}
                  </h3>
                  <p className="text-arcane-grey">
                    {contactCopy.info.office.lines.map((line) => (
                      <span key={line}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </p>
                </GlassCard>
              </Card3D>

              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">
                    {contactCopy.info.hours.title}
                  </h3>
                  <p className="text-arcane-grey">
                    {contactCopy.info.hours.weekdays}
                    <br />
                    {contactCopy.info.hours.emergency}
                  </p>
                </GlassCard>
              </Card3D>
            </motion.div>

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <Card3D>
                <GlassCard variant="elevated" className="p-8 md:p-12">
                  <div className="mb-8">
                    <h2 className="text-4xl font-black mb-4 uppercase">
                      {contactCopy.form.title} <NeonText>{contactCopy.form.highlight}</NeonText>
                    </h2>
                    <p className="text-arcane-grey">
                      {contactCopy.form.description}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="absolute left-[-10000px] top-auto h-0 w-0 overflow-hidden" aria-hidden="true">
                      <label htmlFor="contact-company">Company</label>
                      <input
                        id="contact-company"
                        name="company"
                        type="text"
                        tabIndex={-1}
                        autoComplete="off"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        {contactCopy.form.fields.name.label}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                        placeholder={contactCopy.form.fields.name.placeholder}
                      />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          {contactCopy.form.fields.email.label}
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                          placeholder={contactCopy.form.fields.email.placeholder}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          {contactCopy.form.fields.phone.label}
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                          placeholder={contactCopy.form.fields.phone.placeholder}
                        />
                      </div>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        {contactCopy.form.fields.type.label}
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                      >
                        {Object.entries(contactCopy.form.typeOptions).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        {contactCopy.form.fields.message.label}
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
                        placeholder={contactCopy.form.fields.message.placeholder}
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full shadow-[0_0_30px_rgba(228,255,59,0.4)]"
                        disabled={isSubmitting}
                        aria-busy={isSubmitting}
                      >
                        <Send className="mr-2 h-5 w-5" />
                        {contactCopy.form.submit}
                      </Button>
                    </motion.div>

                    <p className="text-sm text-arcane-grey text-center">
                      {contactCopy.form.disclaimer}
                    </p>
                  </form>
                </GlassCard>
              </Card3D>
            </motion.div>
          </div>

          {/* Additional Info */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <GlassCard variant="elevated" className="p-12 text-center">
              <Globe className="h-12 w-12 text-arcane-accent mx-auto mb-6" />
              <h3 className="text-3xl font-black mb-4 uppercase" data-test="contact-global-title">
                <NeonText>{contactCopy.global.title}</NeonText>
              </h3>
              <p className="text-xl text-arcane-grey max-w-3xl mx-auto mb-8">
                {contactCopy.global.description}
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-arcane-grey">
                {contactCopy.global.regions.map((region) => (
                  <span key={region}>{region}</span>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
