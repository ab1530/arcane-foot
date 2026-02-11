/**
 * ARCANE ANIMATIONS - 120K PREMIUM
 * Variantes d'animation Framer Motion pour des transitions fluides
 */

import { Variants } from "framer-motion";
import { tokens } from "./tokens";

// ========================================
// FADE ANIMATIONS
// ========================================

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      duration: tokens.animation.duration.default,
      ease: tokens.animation.ease.out,
    }
  },
  exit: {
    opacity: 0,
    transition: {
      duration: tokens.animation.duration.fast,
      ease: tokens.animation.ease.in,
    }
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: tokens.animation.spring.smooth,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: tokens.animation.duration.fast,
      ease: tokens.animation.ease.in,
    }
  },
};

export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: tokens.animation.spring.smooth,
  },
};

// ========================================
// SCALE ANIMATIONS
// ========================================

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: tokens.animation.spring.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: tokens.animation.duration.fast,
    }
  },
};

export const scalePop: Variants = {
  initial: { scale: 0.8, opacity: 0 },
  animate: {
    scale: 1,
    opacity: 1,
    transition: tokens.animation.spring.bouncy,
  },
};

// ========================================
// SLIDE ANIMATIONS
// ========================================

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: tokens.animation.spring.default,
  },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 60 },
  animate: {
    opacity: 1,
    x: 0,
    transition: tokens.animation.spring.default,
  },
};

// ========================================
// STAGGER ANIMATIONS - Pour listes
// ========================================

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: tokens.animation.spring.smooth,
  },
};

// ========================================
// GLASS CARD HOVER - Premium effect
// ========================================

export const glassCardHover: Variants = {
  initial: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -8,
    transition: tokens.animation.spring.default,
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: tokens.animation.duration.fast,
    }
  },
};

// ========================================
// GLOW EFFECT - Effet néon
// ========================================

export const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 12px rgba(228, 255, 59, 0.2)",
      "0 0 24px rgba(228, 255, 59, 0.4)",
      "0 0 12px rgba(228, 255, 59, 0.2)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

// ========================================
// SCROLL REVEAL - Apparition au scroll
// ========================================

export const scrollReveal: Variants = {
  initial: {
    opacity: 0,
    y: 60,
    scale: 0.95,
  },
  whileInView: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...tokens.animation.spring.smooth,
      delay: 0.1,
    }
  },
};

// ========================================
// PARALLAX SCROLL
// ========================================

export const createParallaxConfig = (speed: number = 0.5) => ({
  y: [0, speed * 100],
  transition: {
    duration: 0,
  }
});

// ========================================
// NAVBAR SCROLL - Navigation dynamique
// ========================================

export const navbarScroll: Variants = {
  top: {
    backgroundColor: "rgba(8, 12, 29, 0)",
    backdropFilter: "blur(0px)",
    borderBottomColor: "rgba(27, 33, 51, 0)",
  },
  scrolled: {
    backgroundColor: "rgba(8, 12, 29, 0.9)",
    backdropFilter: "blur(16px)",
    borderBottomColor: "rgba(27, 33, 51, 0.5)",
    transition: {
      duration: tokens.animation.duration.default,
      ease: tokens.animation.ease.out,
    }
  },
};

// ========================================
// BUTTON HOVER - Micro-interaction premium
// ========================================

export const buttonHover: Variants = {
  initial: { scale: 1 },
  hover: {
    scale: 1.05,
    boxShadow: "0 0 24px rgba(228, 255, 59, 0.4)",
    transition: tokens.animation.spring.bouncy,
  },
  tap: {
    scale: 0.97,
    transition: {
      duration: tokens.animation.duration.fast,
    }
  },
};

// ========================================
// COUNT UP ANIMATION - Pour stats
// ========================================

export const createCountUpAnimation = (from: number, to: number, duration: number = 2) => ({
  initial: from,
  animate: to,
  transition: {
    duration,
    ease: "easeOut",
  }
});

// ========================================
// DRAW ANIMATION - Pour SVG/lignes
// ========================================

export const drawLine: Variants = {
  initial: { pathLength: 0, opacity: 0 },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1.5,
        ease: "easeInOut"
      },
      opacity: {
        duration: 0.3
      },
    }
  },
};

// ========================================
// FLOATING ANIMATION - Effet de flottement
// ========================================

export const floating = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
    }
  }
};

// ========================================
// SHIMMER EFFECT - Brillance
// ========================================

export const shimmer = {
  animate: {
    backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "linear",
    }
  }
};
