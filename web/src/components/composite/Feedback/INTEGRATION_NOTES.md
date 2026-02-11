# Feedback Components - Integration Notes

## Installation Required

### 1. Install Zustand

The Toast component uses Zustand for global state management. Install it:

```bash
cd web
npm install zustand
# or
pnpm add zustand
# or
yarn add zustand
```

## Setup Instructions

### 1. Add ToastContainer to Root Layout

Add the `ToastContainer` component to your root layout (`app/layout.tsx`):

```tsx
import { ToastContainer } from '@/components/composite/Feedback';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        {/* Add ToastContainer at the end of body */}
        <ToastContainer position="top-right" maxToasts={5} />
      </body>
    </html>
  );
}
```

### 2. Verify Animations

All required animations are already added to `/web/src/styles/animations.css`. No action needed.

### 3. Component Usage

Import and use the components:

```tsx
// Toast
import { toast } from '@/components/composite/Feedback';
toast.success('Success message!');

// Modal
import { Modal } from '@/components/composite/Feedback';
<Modal isOpen={isOpen} onClose={onClose}>Content</Modal>

// AlertDialog
import { AlertDialog } from '@/components/composite/Feedback';
<AlertDialog isOpen={isOpen} onClose={onClose} title="Title" description="Description" />

// Tooltip
import { Tooltip } from '@/components/composite/Feedback';
<Tooltip content="Tooltip text"><button>Hover me</button></Tooltip>

// Popover
import { Popover } from '@/components/composite/Feedback';
<Popover content={<div>Content</div>}><button>Click me</button></Popover>
```

## File Structure

```
web/src/components/composite/Feedback/
├── Toast/
│   ├── Toast.tsx              # Individual toast component
│   ├── ToastContainer.tsx     # Toast container (portal)
│   ├── useToast.ts            # Hook + helper functions
│   ├── types.ts               # Toast types
│   └── index.ts
├── Modal.tsx                  # Modal component
├── AlertDialog.tsx            # Alert dialog component
├── Tooltip.tsx                # Tooltip component
├── Popover.tsx                # Popover component
├── types.ts                   # All exported types
├── index.ts                   # Main exports
├── README.md                  # Documentation
├── INTEGRATION_NOTES.md       # This file
└── SHOWCASE_EXAMPLE.tsx       # Live examples
```

## Dependencies

- **zustand** (^4.5.0) - State management for Toast
- **lucide-react** (already installed) - Icons
- **framer-motion** (already installed) - Optional for advanced animations
- **react-dom** (already installed) - Portals for Toast, Modal, Tooltip, Popover

## Z-Index Layers

Components use the following z-index values:

- Toast: 9999
- Modal: 9998
- Popover: 9997
- Tooltip: 9997

Ensure no other components in your app use higher z-index values, or adjust accordingly.

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- Keyboard navigation (Tab, Enter, ESC)
- ARIA attributes (roles, labels, live regions)
- Focus management (focus trap, focus restoration)
- Screen reader support
- Reduced motion support

## Testing Checklist

- [ ] Install zustand
- [ ] Add ToastContainer to root layout
- [ ] Test Toast notifications (all variants)
- [ ] Test Modal (all sizes)
- [ ] Test AlertDialog (all variants)
- [ ] Test Tooltip (all placements)
- [ ] Test Popover (click and hover triggers)
- [ ] Test keyboard navigation
- [ ] Test on mobile devices
- [ ] Test with screen readers

## Known Issues

None at this time.

## Support

For questions or issues, refer to:
- README.md for usage examples
- SHOWCASE_EXAMPLE.tsx for live demos
- Arcane Design System documentation
