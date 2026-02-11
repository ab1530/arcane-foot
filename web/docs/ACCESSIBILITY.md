# Arcane Football - Accessibility Guidelines

## Overview

Arcane Football is committed to WCAG 2.1 Level AA compliance to ensure our platform is accessible to all users, including those with disabilities.

**Target Standard:** WCAG 2.1 Level AA
**Current Status:** In Progress
**Last Updated:** November 6, 2025

---

## Table of Contents

1. [Color Contrast](#color-contrast)
2. [Keyboard Navigation](#keyboard-navigation)
3. [Screen Readers](#screen-readers)
4. [Focus Management](#focus-management)
5. [Forms and Input](#forms-and-input)
6. [Interactive Components](#interactive-components)
7. [Motion and Animation](#motion-and-animation)
8. [Testing Checklist](#testing-checklist)
9. [Tools and Utilities](#tools-and-utilities)

---

## Color Contrast

### WCAG AA Requirements

- **Normal text** (< 18pt): Minimum 4.5:1 contrast ratio
- **Large text** (≥ 18pt or ≥ 14pt bold): Minimum 3:1 contrast ratio
- **UI components and graphics**: Minimum 3:1 contrast ratio

### Arcane Brand Colors - Contrast Tests

Our brand colors have been tested for WCAG AA compliance:

```typescript
import { meetsWCAG_AA, getContrastRatio } from '@/lib/accessibility';

// ✅ PASS - White on Dark Background
getContrastRatio('#FFFFFF', '#080C1D'); // ~15:1 ratio

// ✅ PASS - Accent Yellow on Dark Background
getContrastRatio('#E4FF3B', '#080C1D'); // ~13:1 ratio

// ⚠️ CHECK - Grey text on Dark (use for secondary text only)
getContrastRatio('#9FA1A9', '#080C1D'); // ~6.5:1 ratio
```

### Usage Guidelines

**✅ DO:**
- Use `#FFFFFF` (white) for primary text on dark backgrounds
- Use `#E4FF3B` (accent yellow) for CTAs and highlights on dark backgrounds
- Use `#9FA1A9` (grey) for secondary text (18pt+ or large body text)
- Test all custom color combinations with our contrast checker

**❌ DON'T:**
- Use low-contrast colors for critical information
- Rely solely on color to convey information
- Use accent yellow for body text on light backgrounds

### Code Example

```typescript
import { meetsWCAG_AA } from '@/lib/accessibility';

const foreground = '#E4FF3B';
const background = '#080C1D';

if (!meetsWCAG_AA(foreground, background)) {
  console.warn('Color combination fails WCAG AA standards');
}
```

---

## Keyboard Navigation

### Requirements

All interactive elements must be accessible via keyboard:

- `Tab` - Move focus forward
- `Shift + Tab` - Move focus backward
- `Enter` or `Space` - Activate buttons/links
- `Arrow Keys` - Navigate within components (menus, tabs, etc.)
- `Escape` - Close modals, dropdowns, etc.
- `Home` - Jump to first item
- `End` - Jump to last item

### Skip Links

We provide skip links for keyboard users to bypass repetitive content:

```tsx
import { SkipLinks } from '@/components/accessibility/SkipLinks';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SkipLinks />
        <main id="main-content">{children}</main>
      </body>
    </html>
  );
}
```

### Focus Trap

For modals and dropdowns, trap focus within the component:

```tsx
import { useFocusTrap } from '@/lib/accessibility';

function Modal({ isOpen, onClose }) {
  const focusTrapRef = useFocusTrap(isOpen);

  return (
    <div ref={focusTrapRef} role="dialog" aria-modal="true">
      <button onClick={onClose}>Close</button>
      {/* Modal content */}
    </div>
  );
}
```

### Focus Visible Styles

Always provide visible focus indicators:

```css
/* ✅ Good - Clear focus indicator */
.button:focus-visible {
  outline: 2px solid #E4FF3B;
  outline-offset: 2px;
}

/* ❌ Bad - No focus indicator */
.button:focus {
  outline: none;
}
```

---

## Screen Readers

### ARIA Attributes

Use ARIA attributes to enhance semantic meaning:

```tsx
// ✅ Proper button with label
<button aria-label="Close dialog" onClick={onClose}>
  <IconX />
</button>

// ✅ Descriptive link
<a href="/profile" aria-describedby="profile-hint">
  My Profile
</a>
<span id="profile-hint" className="sr-only">
  View and edit your personal information
</span>

// ✅ Live region for dynamic updates
<div role="status" aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Screen Reader Only Content

Use the `ScreenReaderOnly` component for hidden but accessible content:

```tsx
import { ScreenReaderOnly } from '@/components/accessibility/SkipLinks';

<button>
  <IconSave />
  <ScreenReaderOnly>Save changes</ScreenReaderOnly>
</button>
```

### Announcements

Use the `useAnnouncer` hook to announce dynamic changes:

```tsx
import { useAnnouncer } from '@/lib/accessibility';

function Form() {
  const { announce, AnnouncerComponent } = useAnnouncer();

  const handleSubmit = () => {
    // ... submit logic
    announce('Form submitted successfully', 'polite');
  };

  return (
    <>
      <AnnouncerComponent />
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
    </>
  );
}
```

---

## Focus Management

### Auto-focus Rules

- **DO** auto-focus the first input in a modal/dialog
- **DON'T** auto-focus inputs on page load (unless it's a search page)
- **DO** return focus to the trigger element when closing a modal

### Form Error Focus

Automatically focus the first error field:

```tsx
import { useFormErrorFocus } from '@/lib/accessibility';

function ContactForm() {
  const { errors, register, handleSubmit } = useForm();

  // Automatically focuses first error field
  useFormErrorFocus(errors);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: true })} />
      {errors.email && <span role="alert">Email is required</span>}
    </form>
  );
}
```

---

## Forms and Input

### Label Requirements

Every input MUST have an associated label:

```tsx
// ✅ Visible label (preferred)
<label htmlFor="email">Email Address</label>
<input id="email" type="email" name="email" />

// ✅ Hidden label (when design constraints exist)
<label htmlFor="search" className="sr-only">Search players</label>
<input id="search" type="search" placeholder="Search..." />

// ✅ aria-label (when no visible label exists)
<input type="search" aria-label="Search players" />

// ❌ No label
<input type="email" placeholder="Enter email" />
```

### Error Messages

Error messages should be associated with their inputs:

```tsx
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-describedby="password-error"
  aria-invalid={!!errors.password}
/>
{errors.password && (
  <span id="password-error" role="alert">
    {errors.password.message}
  </span>
)}
```

### Required Fields

Indicate required fields clearly:

```tsx
<label htmlFor="name">
  Full Name <span aria-label="required">*</span>
</label>
<input id="name" required aria-required="true" />
```

---

## Interactive Components

### Buttons

```tsx
// ✅ Native button (preferred)
<button onClick={handleClick}>Save</button>

// ✅ Custom button with proper role
<div role="button" tabIndex={0} onClick={handleClick} onKeyDown={handleKeyDown}>
  Save
</div>

// ❌ Non-interactive element as button
<div onClick={handleClick}>Save</div>
```

### Links vs Buttons

- **Links** navigate to a new location
- **Buttons** perform an action

```tsx
// ✅ Correct usage
<a href="/profile">View Profile</a>
<button onClick={saveChanges}>Save Changes</button>

// ❌ Wrong usage
<a href="#" onClick={saveChanges}>Save</a>
<button onClick={() => router.push('/profile')}>View Profile</button>
```

### Modals and Dialogs

```tsx
import { useFocusTrap } from '@/lib/accessibility';

function Modal({ isOpen, onClose, title, children }) {
  const focusTrapRef = useFocusTrap(isOpen);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      ref={focusTrapRef}
    >
      <h2 id="modal-title">{title}</h2>
      <button aria-label="Close dialog" onClick={onClose}>
        <IconX />
      </button>
      {children}
    </div>
  );
}
```

### Dropdowns and Menus

```tsx
import { useKeyboardNavigation } from '@/lib/accessibility';

function Dropdown({ items, onSelect }) {
  const { activeIndex, containerProps, getItemProps } = useKeyboardNavigation(
    items.length,
    { onSelect }
  );

  return (
    <ul {...containerProps}>
      {items.map((item, index) => (
        <li key={item.id} {...getItemProps(index)}>
          {item.label}
        </li>
      ))}
    </ul>
  );
}
```

---

## Motion and Animation

### Respect User Preferences

Always respect `prefers-reduced-motion`:

```tsx
import { usePrefersReducedMotion } from '@/lib/accessibility';

function AnimatedComponent() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1 }}
      transition={{
        duration: prefersReducedMotion ? 0 : 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}
```

### CSS Approach

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Guidelines

- **DO** provide animations with duration < 5 seconds
- **DO** allow users to pause/stop animations
- **DON'T** use flashing content (3 flashes per second or more)
- **DON'T** auto-play videos with sound

---

## Testing Checklist

### Manual Testing

- [ ] Can you navigate the entire page using only keyboard?
- [ ] Are all interactive elements reachable via Tab?
- [ ] Do all interactive elements have visible focus indicators?
- [ ] Can you close modals with Escape key?
- [ ] Do skip links appear when you press Tab?

### Screen Reader Testing

Test with at least one screen reader:
- **macOS:** VoiceOver (Cmd + F5)
- **Windows:** NVDA (free) or JAWS
- **iOS:** VoiceOver (Settings → Accessibility)
- **Android:** TalkBack (Settings → Accessibility)

Checklist:
- [ ] Are all images described with alt text?
- [ ] Are form inputs properly labeled?
- [ ] Are error messages announced?
- [ ] Are dynamic content changes announced?
- [ ] Are landmark regions properly defined?

### Automated Testing

Use browser extensions and tools:

```bash
# Install axe-core for automated testing
npm install --save-dev @axe-core/react

# Run Lighthouse accessibility audit
npx lighthouse https://arcane-football.com --only-categories=accessibility
```

In your app:

```tsx
// Add axe-core in development
if (process.env.NODE_ENV !== 'production') {
  import('@axe-core/react').then((axe) => {
    axe.default(React, ReactDOM, 1000);
  });
}
```

### Color Contrast Testing

```typescript
import { printContrastReport } from '@/lib/accessibility';

// Run this in browser console during development
printContrastReport();
```

---

## Tools and Utilities

### Contrast Checker

```typescript
import { getContrastRatio, meetsWCAG_AA } from '@/lib/accessibility';

const ratio = getContrastRatio('#E4FF3B', '#080C1D');
const passes = meetsWCAG_AA('#E4FF3B', '#080C1D');
```

### Focus Trap

```typescript
import { useFocusTrap } from '@/lib/accessibility';

const focusTrapRef = useFocusTrap(isActive);
```

### Announcer

```typescript
import { useAnnouncer } from '@/lib/accessibility';

const { announce, AnnouncerComponent } = useAnnouncer();
announce('Search completed with 10 results', 'polite');
```

### Keyboard Navigation

```typescript
import { useKeyboardNavigation } from '@/lib/accessibility';

const { activeIndex, containerProps, getItemProps } = useKeyboardNavigation(
  items.length,
  { orientation: 'vertical', loop: true, onSelect: handleSelect }
);
```

### Accessible ID Generation

```typescript
import { useAccessibleId } from '@/lib/accessibility';

const labelId = useAccessibleId('label');
const descriptionId = useAccessibleId('description');

<div aria-labelledby={labelId} aria-describedby={descriptionId}>
  <h2 id={labelId}>Title</h2>
  <p id={descriptionId}>Description</p>
</div>
```

---

## Resources

### Official Guidelines
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Chrome DevTools
- [Pa11y](https://pa11y.org/) - Automated testing

### Screen Readers
- [VoiceOver (macOS/iOS)](https://www.apple.com/accessibility/voiceover/)
- [NVDA (Windows)](https://www.nvaccess.org/)
- [JAWS (Windows)](https://www.freedomscientific.com/products/software/jaws/)
- [TalkBack (Android)](https://support.google.com/accessibility/android/answer/6283677)

---

## Contributing

When adding new features, please ensure:

1. All interactive elements are keyboard accessible
2. All images have appropriate alt text
3. Color contrast meets WCAG AA standards
4. Forms have proper labels and error messages
5. Dynamic content changes are announced to screen readers
6. Motion respects `prefers-reduced-motion`

Run the accessibility checklist before submitting PRs.

---

**Questions?** Contact the development team or refer to the [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/).
