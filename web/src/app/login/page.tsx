"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { GradientText, NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, Zap } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
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
      toast.success("Login successful!", {
        description: "Redirecting to your dashboard...",
      });
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = "Login failed. Please check your credentials.";
      setError(errorMessage);
      toast.error("Login Failed", {
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
          Back to Home
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
                  Welcome Back
                </span>
              </motion.div>
              <h1 className="text-6xl md:text-7xl font-black mb-6">
                <GradientText animated className="block mb-2">
                  ACCESS YOUR
                </GradientText>
                <NeonText className="block">
                  ELITE PORTAL
                </NeonText>
              </h1>
              <p className="text-xl text-arcane-grey mb-8 leading-relaxed">
                Sign in to manage your career, track performance, and connect with top clubs worldwide
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                { icon: Shield, text: "Secure & encrypted authentication" },
                { icon: Zap, text: "Real-time performance dashboard" },
                { icon: Mail, text: "Direct agent communication" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-full bg-arcane-accent/10 flex items-center justify-center">
                    <feature.icon className="h-6 w-6 text-arcane-accent" />
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
            <Card3D>
              <GlassCard variant="elevated" className="p-8 md:p-12">
                <div className="mb-8">
                  <h2 className="text-4xl font-black mb-2 uppercase">
                    <NeonText>Sign In</NeonText>
                  </h2>
                  <p className="text-arcane-grey">
                    Enter your credentials to access your account
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
                      Email Address *
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                        placeholder="player@arcane.li"
                      />
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-12 pr-12 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                        placeholder="Enter your password"
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
                      <span className="text-sm text-arcane-grey">Remember me</span>
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-arcane-accent hover:text-white transition-colors"
                    >
                      Forgot password?
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
                          Signing In...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          Sign In
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
                        New to Arcane?
                      </span>
                    </div>
                  </div>

                  {/* Sign Up Link */}
                  <Link href="/signup">
                    <Button variant="secondary" size="lg" className="w-full">
                      Create an Account
                    </Button>
                  </Link>

                  {/* Terms */}
                  <p className="text-xs text-arcane-grey text-center">
                    By signing in, you agree to our{" "}
                    <Link href="/terms" className="text-arcane-accent hover:text-white transition-colors">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-arcane-accent hover:text-white transition-colors">
                      Privacy Policy
                    </Link>
                  </p>
                </form>
              </GlassCard>
            </Card3D>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
