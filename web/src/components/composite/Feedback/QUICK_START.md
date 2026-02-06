# Feedback Components - Quick Start Guide

Get up and running with Arcane Feedback Components in 3 minutes.

## 1. Install Zustand (30 seconds)

```bash
cd web
npm install zustand
```

## 2. Add ToastContainer (1 minute)

Edit your root layout (`app/layout.tsx`):

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

## 3. Use Components (1 minute)

```tsx
import {
  toast,
  Modal,
  AlertDialog,
  Tooltip,
  Popover,
} from '@/components/composite/Feedback';

// Toast - Anywhere in your app
toast.success('Success!');
toast.error('Error!');
toast.warning('Warning!');
toast.info('Info!');

// Modal
const [open, setOpen] = useState(false);
<Modal isOpen={open} onClose={() => setOpen(false)} title="Title">
  Content
</Modal>

// AlertDialog
<AlertDialog
  isOpen={open}
  onClose={() => setOpen(false)}
  variant="danger"
  title="Delete?"
  description="This cannot be undone"
  onConfirm={handleDelete}
/>

// Tooltip
<Tooltip content="Help text">
  <button>Hover me</button>
</Tooltip>

// Popover
<Popover content={<div>Rich content</div>} trigger="click">
  <button>Click me</button>
</Popover>
```

## Done! 🎉

That's it! You're ready to use all 5 feedback components.

## Common Patterns

### Form Submission Success
```tsx
const handleSubmit = async () => {
  try {
    await saveData();
    toast.success('Saved!', {
      description: 'Your changes have been saved',
    });
  } catch (error) {
    toast.error('Failed to save', {
      description: error.message,
    });
  }
};
```

### Delete Confirmation
```tsx
const [showAlert, setShowAlert] = useState(false);

<ArcaneButton variant="danger" onClick={() => setShowAlert(true)}>
  Delete
</ArcaneButton>

<AlertDialog
  isOpen={showAlert}
  onClose={() => setShowAlert(false)}
  variant="danger"
  title="Delete Item"
  description="This action cannot be undone"
  onConfirm={async () => {
    await deleteItem();
    toast.success('Deleted');
    setShowAlert(false);
  }}
/>
```

### Action Tooltips
```tsx
<div className="flex gap-2">
  <Tooltip content="Edit">
    <IconButton icon={<Edit />} aria-label="Edit" />
  </Tooltip>

  <Tooltip content="Delete">
    <IconButton icon={<Trash />} aria-label="Delete" />
  </Tooltip>
</div>
```

### Info Popover
```tsx
<Popover
  trigger="hover"
  content={
    <div className="p-3 max-w-xs">
      <p className="text-sm">Additional information here</p>
    </div>
  }
>
  <Info size={16} className="text-blue-400 cursor-help" />
</Popover>
```

## Need More Help?

- **Full Docs:** See [README.md](./README.md)
- **Examples:** See [SHOWCASE_EXAMPLE.tsx](./SHOWCASE_EXAMPLE.tsx)
- **Setup:** See [INTEGRATION_NOTES.md](./INTEGRATION_NOTES.md)
