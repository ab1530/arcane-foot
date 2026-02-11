# Form Components - Tier 2 Composite Components

Full-featured form components with validation, accessibility, and the Arcane Design System aesthetic.

## 📦 Components

### 1. Form
Main form wrapper with validation and state management.

**Features:**
- Form validation with error handling
- Loading state management
- Disabled state
- Submit handler with form data
- Context for child components
- Multi-step form support (via state management)

**Props:**
```typescript
interface FormProps {
  onSubmit?: FormSubmitHandler;
  loading?: boolean;
  disabled?: boolean;
  validateOnBlur?: boolean;
  validateOnChange?: boolean;
  children: React.ReactNode;
  className?: string;
}
```

**Usage:**
```tsx
<Form onSubmit={handleSubmit} loading={loading}>
  <FormField name="email" label="Email" required>
    <input type="email" name="email" />
  </FormField>

  <FormActions submitText="Submit" />
</Form>
```

---

### 2. FormField
Field wrapper with label, error, and helper text.

**Features:**
- Label with required indicator
- Error message display
- Helper text
- Multiple label positions (top, left, right)
- Accessible field grouping

**Props:**
```typescript
interface FormFieldProps {
  name: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  labelPosition?: "top" | "left" | "right";
  showOptional?: boolean;
}
```

**Usage:**
```tsx
<FormField
  name="username"
  label="Username"
  helperText="Choose a unique username"
  required
>
  <input type="text" name="username" />
</FormField>
```

---

### 3. FormActions
Form action buttons (submit, cancel, etc.)

**Features:**
- Submit and cancel buttons
- Loading state
- Flexible alignment
- Custom actions support

**Props:**
```typescript
interface FormActionsProps {
  submitText?: string;
  cancelText?: string;
  loading?: boolean;
  disabled?: boolean;
  onCancel?: () => void;
  hideCancelButton?: boolean;
  className?: string;
  align?: "left" | "right" | "center" | "between";
  children?: React.ReactNode;
}
```

**Usage:**
```tsx
<FormActions
  submitText="Create Account"
  cancelText="Cancel"
  align="between"
  onCancel={() => console.log("Cancelled")}
>
  <button type="button">Save Draft</button>
</FormActions>
```

---

### 4. Checkbox
Custom styled checkbox with accessibility support.

**Features:**
- Custom styled (replaces native checkbox)
- Checked, unchecked, indeterminate states
- Label positioning (right, left)
- Disabled state
- Error state
- Helper text
- Smooth check animation
- Full keyboard accessibility

**Props:**
```typescript
interface CheckboxProps {
  label?: string;
  helperText?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  indeterminate?: boolean;
  labelPosition?: "right" | "left";
  onCheckedChange?: (checked: boolean) => void;
}
```

**Usage:**
```tsx
<Checkbox
  name="terms"
  label="I agree to the terms and conditions"
  required
/>

<Checkbox
  name="selectAll"
  label="Select All"
  indeterminate={someSelected && !allSelected}
  checked={allSelected}
/>
```

---

### 5. Radio & RadioGroup
Radio button components with keyboard navigation.

**Features:**
- Custom styled (replaces native radio)
- RadioGroup wrapper for multiple options
- Vertical/horizontal layout
- Icon support in labels
- Disabled state
- Error state for group
- Keyboard navigation (arrow keys)
- Description text

**Props:**
```typescript
interface RadioGroupProps {
  name: string;
  label?: string;
  helperText?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  direction?: "vertical" | "horizontal";
}

interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}
```

**Usage:**
```tsx
<RadioGroup
  name="plan"
  label="Select a plan"
  options={[
    {
      value: "free",
      label: "Free Plan",
      description: "Perfect for trying out",
      icon: <StarIcon />
    },
    {
      value: "pro",
      label: "Pro Plan",
      description: "Best for teams - $29/month"
    }
  ]}
  onValueChange={(value) => setPlan(value)}
  required
/>
```

---

### 6. Switch
Toggle switch with loading state and smooth animations.

**Features:**
- Toggle switch with smooth slide animation
- Three sizes: sm, md, lg
- Yellow accent when checked
- Loading state with spinner
- Label positioning
- Disabled and error states
- Helper text
- Full keyboard accessibility

**Props:**
```typescript
interface SwitchProps {
  label?: string;
  helperText?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  labelPosition?: "right" | "left";
  loading?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
```

**Usage:**
```tsx
<Switch
  name="notifications"
  label="Enable notifications"
  onCheckedChange={(checked) => updateSettings({ notifications: checked })}
/>

<Switch
  name="darkMode"
  label="Dark Mode"
  loading={isUpdating}
  checked={darkModeEnabled}
  size="lg"
/>
```

---

## 🎨 Design System

### Colors
- **Active/Checked**: Arcane Yellow (`#E4FF3B`)
- **Focus**: Yellow outline with ring
- **Error**: Red (`#EF4444`)
- **Border**: Slate (`#3F3F46`)
- **Background**: Charcoal (`#27272A`)
- **Text**: Gray 200 (`#E4E4E7`)

### Transitions
- **Duration**: 200ms
- **Easing**: Spring (`cubic-bezier(0.16, 1, 0.3, 1)`)
- **Animations**: Smooth check/uncheck, slide for switch

### Accessibility
- All components have proper ARIA attributes
- Keyboard navigation support
- Focus indicators (yellow ring)
- Screen reader friendly
- Error announcements with `aria-live`

---

## 🚀 Quick Start

### Basic Form Example
```tsx
import { Form, FormField, FormActions, Checkbox } from "@/components/composite/Forms";

const MyForm = () => {
  const handleSubmit = async (submitEvent) => {
    console.log("Form data:", submitEvent.data);
    // Handle form submission
  };

  return (
    <Form onSubmit={handleSubmit}>
      <FormField name="email" label="Email" required>
        <input
          type="email"
          name="email"
          className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
        />
      </FormField>

      <Checkbox name="terms" label="I agree to terms" required />

      <FormActions submitText="Submit" />
    </Form>
  );
};
```

### Settings Page Example
```tsx
import { Switch } from "@/components/composite/Forms";

const Settings = () => {
  const [notifications, setNotifications] = React.useState(true);
  const [loading, setLoading] = React.useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    await updateSettings({ notifications: checked });
    setNotifications(checked);
    setLoading(false);
  };

  return (
    <Switch
      name="notifications"
      label="Push Notifications"
      helperText="Receive important updates"
      checked={notifications}
      loading={loading}
      onCheckedChange={handleToggle}
    />
  );
};
```

---

## 🔗 Integration with React Hook Form

The Form components work seamlessly with React Hook Form:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormField, Checkbox, RadioGroup, Switch } from "@/components/composite/Forms";

// Define validation schema
const schema = z.object({
  email: z.string().email("Invalid email address"),
  plan: z.enum(["free", "pro", "team"], {
    required_error: "Please select a plan",
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms",
  }),
  notifications: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const MyForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      notifications: true,
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log("Valid form data:", data);
    // Submit to API
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} loading={isSubmitting}>
      <FormField
        name="email"
        label="Email"
        error={errors.email?.message}
        required
      >
        <input
          type="email"
          {...register("email")}
          className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
        />
      </FormField>

      <RadioGroup
        name="plan"
        label="Select a plan"
        error={errors.plan?.message}
        options={[
          { value: "free", label: "Free Plan" },
          { value: "pro", label: "Pro Plan" },
          { value: "team", label: "Team Plan" },
        ]}
        value={watch("plan")}
        onValueChange={(value) => setValue("plan", value as any)}
        required
      />

      <Checkbox
        {...register("terms")}
        label="I agree to the terms and conditions"
        error={errors.terms?.message}
        required
      />

      <Switch
        {...register("notifications")}
        label="Enable notifications"
        checked={watch("notifications")}
        onCheckedChange={(checked) => setValue("notifications", checked)}
      />

      <FormActions submitText="Submit" />
    </Form>
  );
};
```

---

## 🧪 Testing

All components are fully testable with proper test IDs and ARIA attributes:

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { Checkbox } from "@/components/composite/Forms";

test("checkbox toggles on click", () => {
  const handleChange = jest.fn();
  render(
    <Checkbox
      name="test"
      label="Test Checkbox"
      onCheckedChange={handleChange}
    />
  );

  const checkbox = screen.getByRole("checkbox");
  fireEvent.click(checkbox);

  expect(handleChange).toHaveBeenCalledWith(true);
});
```

---

## 📱 Responsive Design

All components are fully responsive:
- Touch-friendly sizing (min 44x44px touch targets)
- Adaptive layouts
- Mobile-optimized spacing

---

## ♿ Accessibility

All components meet WCAG 2.1 Level AA standards:
- Keyboard navigation
- Screen reader support
- Focus management
- Color contrast compliance
- Error announcements

---

## 🎯 Best Practices

1. **Always use labels** for form fields
2. **Provide helpful error messages** that explain how to fix the issue
3. **Use helper text** for additional context
4. **Group related fields** with FormField
5. **Show loading states** during async operations
6. **Validate on blur** for better UX (enable with `validateOnBlur`)
7. **Use RadioGroup** instead of individual Radio components
8. **Provide descriptions** for radio options when helpful

---

## 📚 Examples

See `FormShowcase.tsx` for comprehensive examples including:
- Basic form with validation
- Radio groups with icons
- Settings form with switches
- Complex multi-section forms
- Size variants
- Error states
- Disabled states

---

## 🔧 Customization

All components accept a `className` prop for custom styling:

```tsx
<Checkbox
  name="custom"
  label="Custom Styled"
  className="my-custom-class"
/>
```

Components use Tailwind CSS and can be easily themed by modifying:
- `tailwind.config.ts` for colors
- Component files for structure
- CSS for animations

---

## 🐛 Troubleshooting

**Form doesn't submit:**
- Ensure `onSubmit` is passed to Form
- Check for validation errors
- Verify required fields have values

**Checkbox/Switch doesn't update:**
- Use controlled components with `checked` prop
- Or use uncontrolled with `defaultChecked`
- Don't mix controlled and uncontrolled patterns

**Radio buttons don't work:**
- Always use RadioGroup wrapper
- Ensure each option has unique `value`
- Check that `name` prop is set

**Keyboard navigation not working:**
- Ensure components are not disabled
- Check that form elements are properly focused
- Verify ARIA attributes are present

---

## 📄 License

Part of the Arcane Design System - Internal Use

---

## 🤝 Contributing

When adding new form components:
1. Follow the existing patterns
2. Add proper TypeScript types
3. Include accessibility features
4. Add to showcase file
5. Update documentation
