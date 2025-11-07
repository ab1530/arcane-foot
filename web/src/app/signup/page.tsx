"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { Card3D } from "@/components/ui/card-3d";
import { GradientText, NeonText } from "@/components/ui/gradient-text";
import { AnimatedBackground } from "@/components/ui/animated-background";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock, User, Eye, EyeOff, Shield, Phone, Calendar } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

const ACCOUNT_TYPES = [
  { value: "player", label: "Player" },
  { value: "agent", label: "Agent" },
  { value: "club", label: "Club" },
] as const;

type AccountType = typeof ACCOUNT_TYPES[number]["value"];

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    password: "",
    confirmPassword: "",
    accountType: ACCOUNT_TYPES[0].value as AccountType,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (formData.password !== formData.confirmPassword) {
      const errorMsg = "Passwords do not match!";
      setError(errorMsg);
      toast.error("Validation Error", { description: errorMsg });
      return;
    }

    if (formData.password.length < 8) {
      const errorMsg = "Password must be at least 8 characters long!";
      setError(errorMsg);
      toast.error("Validation Error", { description: errorMsg });
      return;
    }

    setIsLoading(true);

    try {
      await signup({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        password: formData.password,
        accountType: formData.accountType,
      });
      toast.success("Account created successfully!", {
        description: "Welcome to Arcane Football! Redirecting...",
      });
      setTimeout(() => router.push("/dashboard"), 500);
    } catch (error) {
      console.error("Signup error:", error);
      const errorMessage = "Signup failed. Please try again.";
      setError(errorMessage);
      toast.error("Signup Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen overflow-hidden relative flex items-center justify-center py-12">
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

      {/* Signup Container */}
      <div className="container-arcane relative z-10 py-20">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-12"
          >
            <motion.div className="inline-block mb-6">
              <span className="text-sm uppercase tracking-widest text-arcane-accent font-bold px-4 py-2 rounded-full border border-arcane-accent/30 bg-arcane-accent/5">
                Join Arcane
              </span>
            </motion.div>
            <h1 className="text-5xl md:text-6xl font-black mb-4">
              <GradientText animated className="block mb-2">
                START YOUR
              </GradientText>
              <NeonText className="block">
                ELITE JOURNEY
              </NeonText>
            </h1>
            <p className="text-xl text-arcane-grey">
              Create your account and unlock world-class representation
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Card3D>
              <GlassCard variant="elevated" className="p-8 md:p-12">
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

                  {/* Account Type */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-3 uppercase tracking-wider">
                      I am a *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {ACCOUNT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, accountType: type.value })}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            formData.accountType === type.value
                              ? "border-arcane-accent bg-arcane-accent/10 text-white"
                              : "border-arcane-darkBorder bg-arcane-darkBorder/20 text-arcane-grey hover:border-arcane-accent/50"
                          }`}
                        >
                          <span className="font-bold">{type.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                      Full Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                        placeholder="John Doe"
                      />
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                    </div>
                  </div>

                  {/* Email & Phone */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        Email *
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

                    <div>
                      <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                        Phone Number
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full pl-12 pr-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                          placeholder="+49 123 456 7890"
                        />
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                      </div>
                    </div>
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                      Date of Birth *
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        required
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                        className="w-full pl-12 pr-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                      />
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
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
                        placeholder="Minimum 8 characters"
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

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-bold text-white mb-2 uppercase tracking-wider">
                      Confirm Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        required
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full pl-12 pr-12 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all"
                        placeholder="Re-enter your password"
                      />
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-arcane-grey" />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-arcane-grey hover:text-arcane-accent transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Terms Agreement */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      required
                      className="mt-1 w-4 h-4 rounded border-arcane-darkBorder bg-arcane-darkBorder/50 text-arcane-accent focus:ring-2 focus:ring-arcane-accent/20"
                    />
                    <label className="text-sm text-arcane-grey">
                      I agree to the{" "}
                      <Link href="/terms" className="text-arcane-accent hover:text-white transition-colors">
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link href="/privacy" className="text-arcane-accent hover:text-white transition-colors">
                        Privacy Policy
                      </Link>
                    </label>
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
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <Shield className="mr-2 h-5 w-5" />
                          Create Account
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
                        Already have an account?
                      </span>
                    </div>
                  </div>

                  {/* Sign In Link */}
                  <Link href="/login">
                    <Button variant="secondary" size="lg" className="w-full">
                      Sign In Instead
                    </Button>
                  </Link>
                </form>
              </GlassCard>
            </Card3D>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
