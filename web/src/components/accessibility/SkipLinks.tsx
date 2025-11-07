/**
 * ARCANE FOOTBALL - SKIP LINKS COMPONENT
 * Allows keyboard users to skip to main content areas
 * WCAG 2.4.1 Bypass Blocks (Level A)
 */

'use client';

import React from 'react';
import { useSkipLinks } from '@/lib/accessibility/hooks';

interface SkipLink {
  href: string;
  label: string;
}

const SKIP_LINKS: SkipLink[] = [
  { href: '#main-content', label: 'Aller au contenu principal' },
  { href: '#navigation', label: 'Aller à la navigation' },
  { href: '#footer', label: 'Aller au pied de page' },
  { href: '#search', label: 'Aller à la recherche' },
];

export function SkipLinks() {
  const showSkipLinks = useSkipLinks();

  return (
    <div
      className={`
        fixed top-0 left-0 z-[9999]
        transition-transform duration-200
        ${showSkipLinks ? 'translate-y-0' : '-translate-y-full'}
      `}
      aria-label="Skip links"
    >
      <nav className="flex flex-col gap-2 p-4 bg-arcane-dark-card border-b border-arcane-accent">
        {SKIP_LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="
              px-4 py-2
              bg-arcane-accent text-arcane-dark
              font-semibold text-sm
              rounded-md
              focus:outline-none focus:ring-2 focus:ring-arcane-accent focus:ring-offset-2
              hover:bg-arcane-accent-hover
              transition-colors
            "
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector(link.href);
              if (target instanceof HTMLElement) {
                target.focus();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </div>
  );
}

/**
 * Screen Reader Only component for visually hidden content
 * that's still accessible to screen readers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * Visually Hidden component that can be focused
 * Useful for skip links and focus management
 */
export function VisuallyHidden({
  children,
  focusable = false,
}: {
  children: React.ReactNode;
  focusable?: boolean;
}) {
  return (
    <span
      className={`
        absolute w-px h-px p-0 -m-px overflow-hidden
        ${focusable ? 'focus:static focus:w-auto focus:h-auto focus:p-2 focus:m-0' : ''}
      `}
      style={{ clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
    >
      {children}
    </span>
  );
}

/**
 * Live Region component for announcing dynamic content to screen readers
 */
export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}
