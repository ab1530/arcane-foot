# Form Components - Quick Reference

## Import

```tsx
import {
  Form,
  FormField,
  FormActions,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
} from "@/components/composite/Forms";
```

---

## Form

### Basic Usage
```tsx
<Form onSubmit={handleSubmit} loading={loading}>
  {/* Form content */}
</Form>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onSubmit` | `FormSubmitHandler` | - | Submit handler |
| `loading` | `boolean` | `false` | Loading state |
| `disabled` | `boolean` | `false` | Disabled state |
| `validateOnBlur` | `boolean` | `true` | Validate on blur |
| `validateOnChange` | `boolean` | `false` | Validate on change |

---

## FormField

### Basic Usage
```tsx
<FormField name="email" label="Email" required>
  <input type="email" name="email" />
</FormField>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Field name |
| `label` | `string` | - | Field label |
| `helperText` | `string` | - | Helper text |
| `error` | `string` | - | Error message |
| `required` | `boolean` | `false` | Required field |
| `labelPosition` | `"top" \| "left" \| "right"` | `"top"` | Label position |
| `showOptional` | `boolean` | `false` | Show optional indicator |

---

## FormActions

### Basic Usage
```tsx
<FormActions
  submitText="Submit"
  cancelText="Cancel"
  onCancel={() => console.log("Cancelled")}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `submitText` | `string` | `"Submit"` | Submit button text |
| `cancelText` | `string` | `"Cancel"` | Cancel button text |
| `loading` | `boolean` | - | Loading state |
| `disabled` | `boolean` | - | Disabled state |
| `onCancel` | `() => void` | - | Cancel handler |
| `hideCancelButton` | `boolean` | `false` | Hide cancel button |
| `align` | `"left" \| "right" \| "center" \| "between"` | `"right"` | Button alignment |

---

## Checkbox

### Basic Usage
```tsx
<Checkbox
  name="terms"
  label="I agree to the terms"
  required
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Checkbox name |
| `label` | `string` | - | Checkbox label |
| `helperText` | `string` | - | Helper text |
| `error` | `string` | - | Error message |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant |
| `indeterminate` | `boolean` | `false` | Indeterminate state |
| `labelPosition` | `"right" \| "left"` | `"right"` | Label position |
| `checked` | `boolean` | - | Controlled checked state |
| `defaultChecked` | `boolean` | - | Default checked state |
| `disabled` | `boolean` | `false` | Disabled state |
| `onCheckedChange` | `(checked: boolean) => void` | - | Change handler |

### States
- Unchecked: Gray border, dark background
- Checked: Yellow background with check icon
- Indeterminate: Yellow background with minus icon
- Disabled: 50% opacity
- Error: Red text and icon

---

## RadioGroup

### Basic Usage
```tsx
<RadioGroup
  name="plan"
  label="Select a plan"
  options={[
    { value: "free", label: "Free Plan" },
    { value: "pro", label: "Pro Plan" }
  ]}
  onValueChange={(value) => setPlan(value)}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Radio group name |
| `label` | `string` | - | Group label |
| `helperText` | `string` | - | Helper text |
| `error` | `string` | - | Error message |
| `required` | `boolean` | `false` | Required field |
| `disabled` | `boolean` | `false` | Disabled state |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant |
| `options` | `RadioOption[]` | **required** | Radio options |
| `value` | `string` | - | Controlled value |
| `defaultValue` | `string` | - | Default value |
| `direction` | `"vertical" \| "horizontal"` | `"vertical"` | Layout direction |
| `onValueChange` | `(value: string) => void` | - | Change handler |

### RadioOption Type
```typescript
interface RadioOption {
  value: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}
```

### Keyboard Navigation
- `Arrow Up/Down`: Navigate options (vertical)
- `Arrow Left/Right`: Navigate options (horizontal)
- `Space/Enter`: Select option

---

## Radio (Standalone)

### Basic Usage
```tsx
<Radio
  name="plan"
  value="pro"
  label="Pro Plan"
  description="Best for teams"
/>
```

**Note:** Usually used inside RadioGroup, but can be used standalone.

---

## Switch

### Basic Usage
```tsx
<Switch
  name="notifications"
  label="Enable notifications"
  onCheckedChange={(checked) => setEnabled(checked)}
/>
```

### Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `string` | **required** | Switch name |
| `label` | `string` | - | Switch label |
| `helperText` | `string` | - | Helper text |
| `error` | `string` | - | Error message |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Size variant |
| `labelPosition` | `"right" \| "left"` | `"right"` | Label position |
| `loading` | `boolean` | `false` | Loading state |
| `checked` | `boolean` | - | Controlled checked state |
| `defaultChecked` | `boolean` | - | Default checked state |
| `disabled` | `boolean` | `false` | Disabled state |
| `onCheckedChange` | `(checked: boolean) => void` | - | Change handler |

### States
- Unchecked: Gray track, white thumb
- Checked: Yellow track, black thumb
- Loading: Spinner inside thumb
- Disabled: 50% opacity

---

## React Hook Form Integration

### Setup
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  plan: z.enum(["free", "pro"]),
  terms: z.boolean().refine(val => val === true),
  notifications: z.boolean(),
});

const MyForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
  });

  return (
    <Form onSubmit={handleSubmit(onSubmit)} loading={isSubmitting}>
      {/* Fields */}
    </Form>
  );
};
```

### Input Field
```tsx
<FormField name="email" error={errors.email?.message} required>
  <input {...register("email")} />
</FormField>
```

### Checkbox
```tsx
<Checkbox
  {...register("terms")}
  checked={watch("terms")}
  onCheckedChange={(c) => setValue("terms", c)}
  error={errors.terms?.message}
/>
```

### RadioGroup
```tsx
<RadioGroup
  name="plan"
  options={options}
  value={watch("plan")}
  onValueChange={(v) => setValue("plan", v)}
  error={errors.plan?.message}
/>
```

### Switch
```tsx
<Switch
  {...register("notifications")}
  checked={watch("notifications")}
  onCheckedChange={(c) => setValue("notifications", c)}
/>
```

---

## Common Patterns

### Multi-Step Form
```tsx
const [step, setStep] = useState(1);

<Form onSubmit={handleSubmit}>
  {step === 1 && <Step1Fields />}
  {step === 2 && <Step2Fields />}

  <FormActions
    submitText={step < 3 ? "Next" : "Submit"}
    onCancel={step > 1 ? () => setStep(step - 1) : undefined}
  />
</Form>
```

### Conditional Fields
```tsx
const accountType = watch("accountType");

{accountType === "business" && (
  <FormField name="company" label="Company" required>
    <input {...register("company")} />
  </FormField>
)}
```

### Async Validation
```tsx
const checkUsername = async (username: string) => {
  const available = await checkAvailability(username);
  return available || "Username taken";
};

<FormField
  name="username"
  error={errors.username?.message}
>
  <input
    {...register("username", {
      validate: checkUsername,
    })}
  />
</FormField>
```

---

## Styling Classes

### Arcane Design System Colors
- **Yellow Accent**: `bg-arcane-yellow` (#E4FF3B)
- **Dark Background**: `bg-arcane-charcoal` (#27272A)
- **Border**: `border-arcane-slate` (#3F3F46)
- **Text**: `text-arcane-gray-200` (#E4E4E7)
- **Error**: `text-error` (#EF4444)

### Common Input Styling
```tsx
className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg text-white focus:border-arcane-yellow focus:outline-none transition-colors"
```

---

## Accessibility

All components include:
- Proper ARIA attributes
- Keyboard navigation
- Focus indicators
- Screen reader support
- Error announcements

### ARIA Attributes
- `aria-invalid`: Error state
- `aria-required`: Required fields
- `aria-describedby`: Helper/error text
- `aria-checked`: Checkbox/Switch state
- `role="radiogroup"`: Radio group
- `role="switch"`: Switch component

---

## Size Reference

### Checkbox/Radio Sizes
- **sm**: 16px (4 Tailwind units)
- **md**: 20px (5 Tailwind units)
- **lg**: 24px (6 Tailwind units)

### Switch Sizes
- **sm**: 36x20px track, 16x16px thumb
- **md**: 44x24px track, 20x20px thumb
- **lg**: 56x28px track, 24x24px thumb

---

## Animation Timing

- **Duration**: 200ms
- **Easing**: Spring (`cubic-bezier(0.16, 1, 0.3, 1)`)
- **Effects**: zoom-in, slide, fade-in

---

## Error Handling

### Display Errors
```tsx
<FormField name="email" error={errors.email?.message}>
  <input {...register("email")} />
</FormField>
```

### Set Manual Errors
```tsx
const { setError } = useForm();

setError("email", {
  type: "manual",
  message: "Email already exists",
});
```

### Clear Errors
```tsx
const { clearErrors } = useForm();

clearErrors("email");
// or clear all
clearErrors();
```

---

## File Locations

- Components: `/web/src/components/composite/Forms/`
- Documentation: `README.md`, `INTEGRATION_GUIDE.md`
- Examples: `FormShowcase.tsx`
- Types: `types.ts`, `Form/types.ts`, `Radio/types.ts`

---

## Resources

- [Full Documentation](./README.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Component Summary](./COMPONENT_SUMMARY.md)
- [Examples](./FormShowcase.tsx)
