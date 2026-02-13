"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { GradientText, NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/language-context";

const featureIconMap = {
  shield: Shield,
  zap: Zap,
  mail: Mail,
} as const;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { dictionary } = useLanguage();
  const loginCopy = dictionary.auth.login;
  const heroFeatures = loginCopy.hero.features.map((feature) => ({
    ...feature,
    Icon: featureIconMap[feature.icon as keyof typeof featureIconMap] ?? Shield,
  }));
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(formData.email, formData.password);
      toast.success(loginCopy.toast.successTitle, {
        description: loginCopy.toast.successDescription,
      });
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = getLoginErrorMessage(error, loginCopy.toast.errorDescription);
      setError(errorMessage);
      toast.error(loginCopy.toast.errorTitle, {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden relative flex items-center justify-center">
      <AnimatedBackground />

      {/* Back Button */}
      <Link
        href="/"
        className="fixed top-6 left-6 z-50 flex items-center gap-3 group"
      >
        <div className="p-3 rounded-full bg-arcane-darkBorder/50 backdrop-blur-xl border border-arcane-darkBorder group-hover:border-arcane-accent transition-all">
          <ArrowLeft className="h-5 w-5 text-arcane-accent group-hover:-translate-x-1 transition-transform" />
        </div>
        <span className="text-arcane-grey group-hover:text-white transition-colors hidden md:inline">
          {loginCopy.nav.back}
        </span>
      </Link>

      {/* Logo */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-arcane-accent flex items-center justify-center">
          <span className="text-arcane-dark font-bold text-xl">A</span>
        </div>
        <span className="text-2xl font-bold text-white tracking-tight">ARCANE</span>
      </div>

      {/* Login Container */}
      <div className="container-arcane relative z-10 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left Side - Marketing Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="hidden lg:block"
          >
            <div className="mb-8">
              <motion.div className="inline-block mb-6">
                <span className="text-sm uppercase tracking-widest text-arcane-accent font-bold px-4 py-2 rounded-full border border-arcane-accent/30 bg-arcane-accent/5">
                  {loginCopy.hero.badge}
                </span>
              </motion.div>
              <h1 className="text-6xl md:text-7xl font-black mb-6">
                <GradientText animated className="block mb-2">
                  {loginCopy.hero.heading.line1.toUpperCase()}
                </GradientText>
                <NeonText className="block">
                  {loginCopy.hero.heading.line2.toUpperCase()}
                </NeonText>
              </h1>
              <p className="text-xl text-arcane-grey mb-8 leading-relaxed">
                {loginCopy.hero.description}
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {heroFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center">
                    <feature.Icon className="h-6 w-6 text-arcane-accent" />
                  </div>
                  <span className="text-arcane-grey">{feature.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Login Form */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
              <GlassCard
                variant="elevated"
                glowOnHover
                className="p-8 md:p-12 shadow-[0_0_40px_rgba(228,255,59,0.1)] hover:shadow-[0_0_60px_rgba(228,255,59,0.2)]"
              >
                <div className="mb-8">
                  <h2 className="text-4xl font-black mb-2 uppercase">
                    <NeonText>{loginCopy.form.title}</NeonText>
                  </h2>
                  <p className="text-arcane-grey">
                    {loginCopy.form.subtitle}
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                      {loginCopy.form.emailLabel}
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-black/60 border-2 border-arcane-darkBorder text-white placeholder-arcane-grey/60 focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/30 focus:bg-black/80 transition-all font-medium"
                        placeholder={loginCopy.form.emailPlaceholder}
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                      {loginCopy.form.passwordLabel}
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-12 py-3 rounded-lg bg-black/60 border-2 border-arcane-darkBorder text-white placeholder-arcane-grey/60 focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/30 focus:bg-black/80 transition-all font-medium"
                        placeholder={loginCopy.form.passwordPlaceholder}
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-arcane-grey hover:text-arcane-accent transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-arcane-darkBorder bg-arcane-darkBorder/50 text-arcane-accent focus:ring-2 focus:ring-arcane-accent/20"
                      />
                      <span className="text-sm text-arcane-grey">{loginCopy.form.remember}</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-arcane-accent hover:text-white transition-colors"
                    >
                      {loginCopy.form.forgot}
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      size="lg"
                      className="w-full shadow-[0_0_30px_rgba(228,255,59,0.4)]"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="mr-2"
                          >
                            <Shield className="h-5 w-5" />
                          </motion.div>
                          {loginCopy.form.submit.loading}
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          {loginCopy.form.submit.idle}
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-arcane-darkBorder"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-arcane-dark text-arcane-grey">
                        {loginCopy.form.newQuestion}
                      </span>
                    </div>
                  </div>

                  {/* Sign Up Link */}
                  <Link href="/signup">
                    <Button variant="secondary" size="lg" className="w-full">
                      {loginCopy.form.signupCta}
                    </Button>
                  </Link>

                  {/* Terms */}
                  <p className="text-xs text-arcane-grey text-center">
                    {loginCopy.form.terms.prefix}{" "}
                    <Link href="/terms" className="text-arcane-accent hover:text-white transition-colors">
                      {loginCopy.form.terms.terms}
                    </Link>{" "}
                    {loginCopy.form.terms.connector}{" "}
                    <Link href="/privacy" className="text-arcane-accent hover:text-white transition-colors">
                      {loginCopy.form.terms.privacy}
                    </Link>
                  </p>
                </form>
              </GlassCard>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function getLoginErrorMessage(error: unknown, defaultMessage: string) {
  if (!(error instanceof Error)) return defaultMessage;

  if (error.message === "INVALID_CREDENTIALS") {
    return defaultMessage;
  }

  if (error.message === "NETWORK_ERROR" || error.message.startsWith("LOGIN_HTTP_5")) {
    return "Connexion au serveur impossible. Vérifiez votre réseau et réessayez.";
  }

  if (error.message.startsWith("LOGIN_HTTP_")) {
    return "La connexion a échoué. Réessayez dans un instant.";
  }

  return defaultMessage;
}
