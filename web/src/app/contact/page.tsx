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

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "player",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Connect to API
    // console.log("Form submitted:", formData);

    toast.success("Message sent successfully!", {
      description: "We'll get back to you within 24 hours.",
    });

    // Reset form
    setFormData({
      name: "",
      email: "",
      phone: "",
      type: "player",
      message: "",
    });
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
              <span className="text-arcane-grey group-hover:text-white transition-colors">Back to Home</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-arcane-accent flex items-center justify-center">
                <span className="text-arcane-dark font-bold text-xl">A</span>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
            </div>

            <Link href="/services">
              <Button>Our Services</Button>
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
                Get in Touch
              </span>
            </motion.div>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-black mb-6">
              <GradientText>CONTACT US</GradientText>
            </h1>
            <p className="text-2xl text-arcane-grey max-w-3xl mx-auto">
              Ready to take your career to the next level? <span className="text-white font-bold">Let's talk</span>
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
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">Email</h3>
                  <a href="mailto:contact@arcane.li" className="text-arcane-grey hover:text-arcane-accent transition-colors">
                    contact@arcane.li
                  </a>
                </GlassCard>
              </Card3D>

              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mb-4">
                    <Phone className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">Phone</h3>
                  <a href="tel:+491234567890" className="text-arcane-grey hover:text-arcane-accent transition-colors">
                    +49 123 456 7890
                  </a>
                </GlassCard>
              </Card3D>

              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mb-4">
                    <MapPin className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">Office</h3>
                  <p className="text-arcane-grey">
                    Berlin, Germany<br />
                    Kreuzberg 10997
                  </p>
                </GlassCard>
              </Card3D>

              <Card3D>
                <GlassCard variant="elevated" className="p-6">
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 uppercase">Hours</h3>
                  <p className="text-arcane-grey">
                    Mon - Fri: 9:00 - 18:00<br />
                    24/7 Emergency Support
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
                      Send us a <NeonText>Message</NeonText>
                    </h2>
                    <p className="text-arcane-grey">
                      Fill out the form below and we'll get back to you within 24 hours
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                        placeholder="John Doe"
                      />
                    </div>

                    {/* Email & Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                          placeholder="john@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                          placeholder="+49 123 456 7890"
                        />
                      </div>
                    </div>

                    {/* Type */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        I am a *
                      </label>
                      <select
                        required
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                      >
                        <option value="player">Player</option>
                        <option value="club">Club Representative</option>
                        <option value="scout">Scout</option>
                        <option value="parent">Parent/Guardian</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    {/* Message */}
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        Message *
                      </label>
                      <textarea
                        required
                        rows={6}
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        className="w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all resize-none"
                        placeholder="Tell us about your goals and how we can help..."
                      />
                    </div>

                    {/* Submit Button */}
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button type="submit" size="lg" className="w-full shadow-[0_0_30px_rgba(228,255,59,0.4)]">
                        <Send className="mr-2 h-5 w-5" />
                        Send Message
                      </Button>
                    </motion.div>

                    <p className="text-sm text-arcane-grey text-center">
                      By submitting this form, you agree to our privacy policy and terms of service.
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
              <h3 className="text-3xl font-black mb-4 uppercase">
                <NeonText>Global Coverage</NeonText>
              </h3>
              <p className="text-xl text-arcane-grey max-w-3xl mx-auto mb-8">
                With offices in Berlin, London, and Madrid, we provide 24/7 support to our clients worldwide
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-arcane-grey">
                <span>🇩🇪 Germany</span>
                <span>🇬🇧 United Kingdom</span>
                <span>🇪🇸 Spain</span>
                <span>🇫🇷 France</span>
                <span>🇮🇹 Italy</span>
                <span>🇧🇷 Brazil</span>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
