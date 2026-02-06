# Feedback Components - Arcane Design System

Tier 2 composite components for user feedback and notifications, following the Arcane Design System guidelines.

## Components

### 1. Toast

Interactive toast notifications with auto-dismiss and stacking support.

**Features:**
- 4 variants: `success`, `error`, `info`, `warning`
- Auto-dismiss with configurable duration
- Manual close button
- Action button support
- Multiple toast stacking
- 6 position options
- Slide in/out animations
- Glow effects

**Usage:**

```tsx
import { toast, ToastContainer } from '@/components/composite/Feedback';

// Add ToastContainer to your root layout (once)
<ToastContainer position="top-right" maxToasts={5} />

// Show toasts from anywhere
toast.success('Profile updated successfully!');
toast.error('Failed to save changes');
toast.warning('This action cannot be undone');
toast.info('New features available');

// Advanced usage with options
toast.success('Player created', {
  description: 'John Doe has been added to the database',
  duration: 5000,
  action: {
    label: 'View',
    onClick: () => router.push('/players/123'),
  },
});

// Use hook in components
const { toast, success, error, info, warning, dismiss } = useToast();

success('Operation completed!');
error('Something went wrong', {
  description: 'Please try again later',
});
```

**Props:**

```tsx
interface ToastOptions {
  variant?: 'success' | 'error' | 'info' | 'warning';
  description?: string;
  duration?: number; // milliseconds (0 = no auto-dismiss)
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode; // custom icon
}

interface ToastContainerProps {
  position?: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left' | 'bottom-center';
  maxToasts?: number;
}
```

---

### 2. Modal

Premium modal dialog with glassmorphism and animations.

**Features:**
- 5 sizes: `sm`, `md`, `lg`, `xl`, `fullscreen`
- Backdrop blur with glassmorphism
- Close button (X)
- ESC key support
- Click outside to close (optional)
- Smooth fade + scale animation
- Header, Content, Footer sections
- Focus trap for accessibility

**Usage:**

```tsx
import { Modal } from '@/components/composite/Feedback';
import { ArcaneButton } from '@/components/primitives';

function EditPlayerModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <ArcaneButton onClick={() => setIsOpen(true)}>
        Edit Player
      </ArcaneButton>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        size="md"
        title="Edit Player Profile"
        footer={
          <>
            <ArcaneButton
              variant="secondary"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </ArcaneButton>
            <ArcaneButton
              variant="primary"
              onClick={handleSave}
            >
              Save Changes
            </ArcaneButton>
          </>
        }
      >
        <div className="space-y-4">
          <ArcaneInput label="Name" defaultValue="John Doe" />
          <ArcaneInput label="Position" defaultValue="Forward" />
        </div>
      </Modal>
    </>
  );
}
```

**Props:**

```tsx
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullscreen';
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  closeOnBackdropClick?: boolean; // default: true
  showCloseButton?: boolean; // default: true
  className?: string;
  preventScroll?: boolean; // default: true
}
```

---

### 3. AlertDialog

Confirmation dialog with danger/warning variants.

**Features:**
- 3 variants: `info`, `warning`, `danger`
- Title + description
- Primary + secondary actions
- Confirm/cancel pattern
- Danger variant has red primary button
- Keyboard support (Enter = confirm, ESC = cancel)

**Usage:**

```tsx
import { AlertDialog } from '@/components/composite/Feedback';

function DeletePlayerButton() {
  const [showDialog, setShowDialog] = useState(false);

  const handleDelete = async () => {
    await deletePlayer(playerId);
    toast.success('Player deleted');
  };

  return (
    <>
      <ArcaneButton
        variant="danger"
        onClick={() => setShowDialog(true)}
      >
        Delete Player
      </ArcaneButton>

      <AlertDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        variant="danger"
        title="Delete Player"
        description="Are you sure you want to delete this player? This action cannot be undone and all associated data will be permanently removed."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleDelete}
      />
    </>
  );
}
```

**Props:**

```tsx
interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  variant?: 'info' | 'warning' | 'danger';
  title: string;
  description: string;
  confirmLabel?: string; // default: 'Confirm'
  cancelLabel?: string; // default: 'Cancel'
  onConfirm?: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  className?: string;
}
```

---

### 4. Tooltip

Accessible tooltip with smart positioning.

**Features:**
- 4 placements: `top`, `bottom`, `left`, `right`
- Delay before showing (default 200ms)
- Arrow indicator
- Dark background with white text
- Max width for long text
- Smooth fade animation
- Keyboard accessible (show on focus)

**Usage:**

```tsx
import { Tooltip } from '@/components/composite/Feedback';
import { IconButton } from '@/components/primitives';
import { Edit, Trash, Eye } from 'lucide-react';

function PlayerActions() {
  return (
    <div className="flex gap-2">
      <Tooltip content="Edit player profile" placement="top">
        <IconButton
          icon={<Edit />}
          aria-label="Edit"
          onClick={handleEdit}
        />
      </Tooltip>

      <Tooltip content="View detailed statistics" placement="top" delay={300}>
        <IconButton
          icon={<Eye />}
          aria-label="View stats"
          onClick={handleView}
        />
      </Tooltip>

      <Tooltip
        content="Delete this player permanently"
        placement="top"
      >
        <IconButton
          icon={<Trash />}
          variant="danger"
          aria-label="Delete"
          onClick={handleDelete}
        />
      </Tooltip>
    </div>
  );
}
```

**Props:**

```tsx
interface TooltipProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number; // milliseconds
  children: React.ReactElement;
  className?: string;
  disabled?: boolean;
}
```

---

### 5. Popover

Floating content container with custom content.

**Features:**
- Click or hover trigger
- 4 placements: `top`, `bottom`, `left`, `right`
- Arrow indicator
- Custom content support
- Close on click outside
- Smooth fade + scale animation
- Glassmorphism styling

**Usage:**

```tsx
import { Popover } from '@/components/composite/Feedback';
import { ArcaneButton } from '@/components/primitives';

function PlayerStatsPopover() {
  return (
    <Popover
      trigger="click"
      placement="bottom"
      content={
        <div className="p-4 w-64">
          <h3 className="font-bold text-white mb-3">Player Statistics</h3>
          <div className="space-y-2 text-sm text-gray-300">
            <div className="flex justify-between">
              <span>Goals</span>
              <span className="text-arcane-yellow font-semibold">23</span>
            </div>
            <div className="flex justify-between">
              <span>Assists</span>
              <span className="text-arcane-yellow font-semibold">15</span>
            </div>
            <div className="flex justify-between">
              <span>Matches</span>
              <span className="text-arcane-yellow font-semibold">38</span>
            </div>
          </div>
        </div>
      }
    >
      <ArcaneButton variant="secondary">View Stats</ArcaneButton>
    </Popover>
  );
}

// Hover trigger example
function QuickInfoPopover() {
  return (
    <Popover
      trigger="hover"
      placement="right"
      showArrow
      content={
        <div className="p-3 max-w-xs">
          <p className="text-sm text-gray-300">
            This feature uses AI to analyze player performance
          </p>
        </div>
      }
    >
      <span className="inline-flex items-center gap-1 text-blue-400 cursor-help">
        AI Analysis
        <Info size={14} />
      </span>
    </Popover>
  );
}
```

**Props:**

```tsx
interface PopoverProps {
  content: ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  trigger?: 'click' | 'hover';
  children: React.ReactElement;
  className?: string;
  contentClassName?: string;
  disabled?: boolean;
  showArrow?: boolean; // default: true
  closeOnClickOutside?: boolean; // default: true
}
```

---

## Installation

These components are already integrated into the Arcane Design System. To use them:

```tsx
// Import individual components
import {
  Toast,
  ToastContainer,
  useToast,
  toast,
  Modal,
  AlertDialog,
  Tooltip,
  Popover,
} from '@/components/composite/Feedback';

// Or import everything
import * as Feedback from '@/components/composite/Feedback';
```

## Setup

### 1. Add ToastContainer to Root Layout

Add the `ToastContainer` component to your root layout (app/layout.tsx):

```tsx
import { ToastContainer } from '@/components/composite/Feedback';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <ToastContainer position="top-right" maxToasts={5} />
      </body>
    </html>
  );
}
```

### 2. Ensure Zustand is Installed

The Toast component uses Zustand for state management. Make sure it's installed:

```bash
npm install zustand
# or
pnpm add zustand
```

### 3. Animations

All required animations are already defined in `/web/src/styles/animations.css`.

---

## Design Tokens

These components follow the Arcane Design System tokens:

- **Colors**: Success (green), Error (red), Warning (amber), Info (blue)
- **Glassmorphism**: `backdrop-blur-xl` + `rgba(15, 20, 37, 0.95)`
- **Glow Effects**: Variant-specific shadows
- **Z-Index**: Toast (9999), Modal (9998), Popover (9997)
- **Animations**: Spring easing with cubic-bezier curves

---

## Accessibility

All components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support (Tab, Enter, ESC)
- **ARIA Attributes**: Proper roles and labels
- **Focus Management**: Focus trapping in modals, focus restoration
- **Screen Readers**: Semantic HTML and ARIA live regions
- **Reduced Motion**: Respects `prefers-reduced-motion`

---

## Best Practices

### Toast
- Use success for confirmations
- Use error for failures
- Keep messages concise (1-2 sentences)
- Use action buttons for important next steps
- Limit duration to 3-5 seconds

### Modal
- Use for complex forms or multi-step workflows
- Keep modals focused on a single task
- Always provide a way to close (X button, ESC, backdrop)
- Use footer for primary/secondary actions

### AlertDialog
- Use danger variant for destructive actions
- Use warning for actions that need confirmation
- Use info for informational confirmations
- Keep descriptions clear and concise

### Tooltip
- Use for supplementary information
- Keep content short (1-2 lines)
- Don't repeat button text
- Ensure keyboard accessibility

### Popover
- Use for rich content that doesn't fit in a tooltip
- Use click trigger for interactive content
- Use hover trigger for quick information
- Keep content width reasonable (max 400px)

---

## Examples

Check the showcase file for live examples:
`/web/src/components/composite/Feedback/SHOWCASE_EXAMPLE.tsx`

---

## Support

For issues or questions, refer to the Arcane Design System documentation or contact the design team.
