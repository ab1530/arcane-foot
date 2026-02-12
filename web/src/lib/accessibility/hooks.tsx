/**
 * ARCANE FOOTBALL - ACCESSIBILITY HOOKS
 * React hooks for enhanced accessibility features
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Trap focus within a component (useful for modals, dropdowns)
 */
export function useFocusTrap(isActive: boolean) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    function handleTabKey(e: KeyboardEvent) {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    }

    element.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      element.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return ref;
}

/**
 * Announce messages to screen readers
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = useState('');

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
    }, 100);
  };

  return {
    announce,
    AnnouncerComponent: () => (
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {announcement}
      </div>
    ),
  };
}

/**
 * Manage skip links for keyboard navigation
 */
export function useSkipLinks() {
  const [showSkipLinks, setShowSkipLinks] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setShowSkipLinks(true);
      }
    };

    const handleClick = () => {
      setShowSkipLinks(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('mousedown', handleClick);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('mousedown', handleClick);
    };
  }, []);

  return showSkipLinks;
}

/**
 * Detect if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

/**
 * Auto-focus first error in a form
 */
export function useFormErrorFocus(errors: Record<string, any>) {
  useEffect(() => {
    const firstErrorKey = Object.keys(errors)[0];
    if (firstErrorKey) {
      const element = document.querySelector(`[name="${firstErrorKey}"]`) as HTMLElement;
      element?.focus();
    }
  }, [errors]);
}

/**
 * Manage ARIA live regions for dynamic content
 */
export function useAriaLive(message: string, politeness: 'polite' | 'assertive' = 'polite') {
  const [liveMessage, setLiveMessage] = useState('');

  useEffect(() => {
    setLiveMessage(message);
    const timer = setTimeout(() => setLiveMessage(''), 1000);
    return () => clearTimeout(timer);
  }, [message]);

  return {
    'aria-live': politeness,
    'aria-atomic': 'true',
    children: liveMessage,
  };
}

/**
 * Generate unique IDs for aria-labelledby and aria-describedby
 */
let idCounter = 0;
export function useAccessibleId(prefix: string = 'a11y') {
  const [id] = useState(() => {
    idCounter += 1;
    return `${prefix}-${idCounter}`;
  });

  return id;
}

/**
 * Keyboard navigation for lists and menus
 */
export function useKeyboardNavigation<T extends HTMLElement>(
  itemCount: number,
  options: {
    orientation?: 'horizontal' | 'vertical';
    loop?: boolean;
    onSelect?: (index: number) => void;
  } = {}
) {
  const { orientation = 'vertical', loop = true, onSelect } = options;
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<T>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const isVertical = orientation === 'vertical';
    const nextKey = isVertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = isVertical ? 'ArrowUp' : 'ArrowLeft';

    if (e.key === nextKey) {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev + 1;
        return loop ? next % itemCount : Math.min(next, itemCount - 1);
      });
    } else if (e.key === prevKey) {
      e.preventDefault();
      setActiveIndex((prev) => {
        const next = prev - 1;
        return loop
          ? (next + itemCount) % itemCount
          : Math.max(next, 0);
      });
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActiveIndex(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActiveIndex(itemCount - 1);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(activeIndex);
    }
  };

  return {
    activeIndex,
    setActiveIndex,
    containerProps: {
      ref: containerRef,
      onKeyDown: handleKeyDown,
      role: 'listbox',
      'aria-activedescendant': `option-${activeIndex}`,
    },
    getItemProps: (index: number) => ({
      id: `option-${index}`,
      role: 'option',
      'aria-selected': index === activeIndex,
      tabIndex: index === activeIndex ? 0 : -1,
    }),
  };
}
