# Form Components Integration Guide

Complete guide for integrating Form components into your application.

## Table of Contents
1. [Installation & Setup](#installation--setup)
2. [React Hook Form Integration](#react-hook-form-integration)
3. [Zod Validation](#zod-validation)
4. [Custom Validation](#custom-validation)
5. [API Integration](#api-integration)
6. [Common Patterns](#common-patterns)
7. [Advanced Usage](#advanced-usage)

---

## Installation & Setup

### Import Components
```tsx
// Import individual components
import {
  Form,
  FormField,
  FormActions,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
} from "@/components/composite/Forms";

// Import types
import type {
  FormSubmitEvent,
  FormSubmitHandler,
  CheckboxProps,
  RadioGroupProps,
  SwitchProps,
} from "@/components/composite/Forms";
```

### Basic Setup
```tsx
const MyForm = () => {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit: FormSubmitHandler = async ({ data, event }) => {
    setLoading(true);
    try {
      // Your submission logic
      await submitToAPI(data);
    } catch (error) {
      console.error("Submission failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit} loading={loading}>
      {/* Form fields */}
    </Form>
  );
};
```

---

## React Hook Form Integration

### Installation
```bash
npm install react-hook-form @hookform/resolvers zod
```

### Basic Integration
```tsx
import { useForm } from "react-hook-form";
import { Form, FormField, FormActions } from "@/components/composite/Forms";

interface FormData {
  email: string;
  password: string;
}

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    await login(data);
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
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address",
            },
          })}
          className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
        />
      </FormField>

      <FormField
        name="password"
        label="Password"
        error={errors.password?.message}
        required
      >
        <input
          type="password"
          {...register("password", {
            required: "Password is required",
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters",
            },
          })}
          className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
        />
      </FormField>

      <FormActions submitText="Login" />
    </Form>
  );
};
```

### Checkbox Integration
```tsx
import { useForm } from "react-hook-form";
import { Checkbox } from "@/components/composite/Forms";

const SignupForm = () => {
  const { register, watch, setValue, formState: { errors } } = useForm();

  return (
    <Checkbox
      {...register("terms", {
        required: "You must accept the terms",
      })}
      label="I agree to the terms and conditions"
      error={errors.terms?.message}
      checked={watch("terms")}
      onCheckedChange={(checked) => setValue("terms", checked)}
      required
    />
  );
};
```

### RadioGroup Integration
```tsx
import { useForm } from "react-hook-form";
import { RadioGroup } from "@/components/composite/Forms";

const PlanForm = () => {
  const { watch, setValue, formState: { errors } } = useForm({
    defaultValues: { plan: "free" },
  });

  return (
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
      onValueChange={(value) => setValue("plan", value)}
      required
    />
  );
};
```

### Switch Integration
```tsx
import { useForm } from "react-hook-form";
import { Switch } from "@/components/composite/Forms";

const SettingsForm = () => {
  const { register, watch, setValue } = useForm({
    defaultValues: { notifications: true },
  });

  return (
    <Switch
      {...register("notifications")}
      label="Enable notifications"
      checked={watch("notifications")}
      onCheckedChange={(checked) => setValue("notifications", checked)}
    />
  );
};
```

---

## Zod Validation

### Setup with Zod Schema
```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Define schema
const signupSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain an uppercase letter")
    .regex(/[0-9]/, "Password must contain a number"),
  confirmPassword: z.string(),
  plan: z.enum(["free", "pro", "team"], {
    required_error: "Please select a plan",
  }),
  terms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
  newsletter: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

const SignupForm = () => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      newsletter: false,
    },
  });

  const onSubmit = async (data: SignupFormData) => {
    await createAccount(data);
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} loading={isSubmitting}>
      <FormField
        name="username"
        label="Username"
        error={errors.username?.message}
        required
      >
        <input
          type="text"
          {...register("username")}
          className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
        />
      </FormField>

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

      <FormField
        name="password"
        label="Password"
        error={errors.password?.message}
        required
      >
        <input
          type="password"
          {...register("password")}
          className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
        />
      </FormField>

      <FormField
        name="confirmPassword"
        label="Confirm Password"
        error={errors.confirmPassword?.message}
        required
      >
        <input
          type="password"
          {...register("confirmPassword")}
          className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
        />
      </FormField>

      <RadioGroup
        name="plan"
        label="Select a plan"
        error={errors.plan?.message}
        options={[
          { value: "free", label: "Free Plan", description: "Perfect for trying out" },
          { value: "pro", label: "Pro Plan", description: "$9/month" },
          { value: "team", label: "Team Plan", description: "$29/month" },
        ]}
        value={watch("plan")}
        onValueChange={(value) => setValue("plan", value as any)}
        required
      />

      <Checkbox
        {...register("terms")}
        label="I agree to the terms and conditions"
        error={errors.terms?.message}
        checked={watch("terms")}
        onCheckedChange={(checked) => setValue("terms", checked)}
        required
      />

      <Checkbox
        {...register("newsletter")}
        label="Subscribe to newsletter"
        helperText="Get updates about new features"
        checked={watch("newsletter")}
        onCheckedChange={(checked) => setValue("newsletter", checked)}
      />

      <FormActions submitText="Create Account" />
    </Form>
  );
};
```

---

## Custom Validation

### Async Validation (Check Username Availability)
```tsx
import { useForm } from "react-hook-form";

const SignupForm = () => {
  const {
    register,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm();

  const checkUsername = async (username: string) => {
    if (username.length < 3) return;

    try {
      const available = await checkUsernameAvailability(username);
      if (!available) {
        setError("username", {
          type: "manual",
          message: "Username is already taken",
        });
      } else {
        clearErrors("username");
      }
    } catch (error) {
      console.error("Failed to check username:", error);
    }
  };

  return (
    <FormField
      name="username"
      label="Username"
      error={errors.username?.message}
      required
    >
      <input
        type="text"
        {...register("username", {
          required: "Username is required",
          minLength: {
            value: 3,
            message: "Username must be at least 3 characters",
          },
        })}
        onBlur={(e) => checkUsername(e.target.value)}
        className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg"
      />
    </FormField>
  );
};
```

### Cross-Field Validation
```tsx
import { useForm } from "react-hook-form";

const PasswordForm = () => {
  const {
    register,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  return (
    <>
      <FormField
        name="password"
        label="Password"
        error={errors.password?.message}
        required
      >
        <input type="password" {...register("password")} />
      </FormField>

      <FormField
        name="confirmPassword"
        label="Confirm Password"
        error={errors.confirmPassword?.message}
        required
      >
        <input
          type="password"
          {...register("confirmPassword", {
            validate: (value) =>
              value === password || "Passwords don't match",
          })}
        />
      </FormField>
    </>
  );
};
```

---

## API Integration

### Submit with API Call
```tsx
import { useState } from "react";
import { Form, FormActions } from "@/components/composite/Forms";

const ContactForm = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async ({ data }: FormSubmitEvent) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to submit form");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return <div className="text-arcane-yellow">Message sent successfully!</div>;
  }

  return (
    <Form onSubmit={handleSubmit} loading={loading}>
      {error && (
        <div className="p-4 bg-error-bg text-error rounded-lg">
          {error}
        </div>
      )}

      {/* Form fields */}

      <FormActions submitText="Send Message" />
    </Form>
  );
};
```

### Handle API Errors
```tsx
import { useForm } from "react-hook-form";

const LoginForm = () => {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle field-specific errors
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, message]) => {
            setError(field as any, {
              type: "server",
              message: message as string,
            });
          });
        } else {
          // Handle general error
          setError("root", {
            type: "server",
            message: result.message || "Login failed",
          });
        }
        return;
      }

      // Success - redirect or update state
      window.location.href = "/dashboard";
    } catch (error) {
      setError("root", {
        type: "server",
        message: "Network error. Please try again.",
      });
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)} loading={isSubmitting}>
      {errors.root && (
        <div className="p-4 bg-error-bg text-error rounded-lg">
          {errors.root.message}
        </div>
      )}

      <FormField
        name="email"
        label="Email"
        error={errors.email?.message}
        required
      >
        <input type="email" {...register("email")} />
      </FormField>

      <FormField
        name="password"
        label="Password"
        error={errors.password?.message}
        required
      >
        <input type="password" {...register("password")} />
      </FormField>

      <FormActions submitText="Login" />
    </Form>
  );
};
```

---

## Common Patterns

### Multi-Step Form
```tsx
import { useState } from "react";
import { useForm } from "react-hook-form";

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Final submission
      await submitForm(data);
    }
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      {/* Progress indicator */}
      <div className="flex gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 rounded ${
              s === step
                ? "bg-arcane-yellow"
                : s < step
                ? "bg-arcane-gray-400"
                : "bg-arcane-slate"
            }`}
          />
        ))}
      </div>

      {/* Step 1: Account Info */}
      {step === 1 && (
        <>
          <FormField name="email" label="Email" error={errors.email?.message} required>
            <input type="email" {...register("email", { required: true })} />
          </FormField>
          <FormField name="password" label="Password" error={errors.password?.message} required>
            <input type="password" {...register("password", { required: true })} />
          </FormField>
        </>
      )}

      {/* Step 2: Profile */}
      {step === 2 && (
        <>
          <FormField name="name" label="Name" error={errors.name?.message} required>
            <input type="text" {...register("name", { required: true })} />
          </FormField>
          <FormField name="bio" label="Bio" error={errors.bio?.message}>
            <textarea {...register("bio")} />
          </FormField>
        </>
      )}

      {/* Step 3: Preferences */}
      {step === 3 && (
        <>
          <RadioGroup
            name="plan"
            label="Select Plan"
            options={[
              { value: "free", label: "Free" },
              { value: "pro", label: "Pro" },
            ]}
            value={watch("plan")}
          />
          <Checkbox name="terms" label="Accept Terms" required />
        </>
      )}

      <FormActions
        submitText={step < 3 ? "Next" : "Complete"}
        cancelText={step > 1 ? "Back" : undefined}
        onCancel={step > 1 ? () => setStep(step - 1) : undefined}
      />
    </Form>
  );
};
```

### Conditional Fields
```tsx
const ConditionalForm = () => {
  const { register, watch } = useForm();
  const accountType = watch("accountType");

  return (
    <Form>
      <RadioGroup
        name="accountType"
        label="Account Type"
        options={[
          { value: "personal", label: "Personal" },
          { value: "business", label: "Business" },
        ]}
      />

      {/* Show only for business accounts */}
      {accountType === "business" && (
        <>
          <FormField name="company" label="Company Name" required>
            <input type="text" {...register("company")} />
          </FormField>
          <FormField name="taxId" label="Tax ID" required>
            <input type="text" {...register("taxId")} />
          </FormField>
        </>
      )}

      <FormActions submitText="Continue" />
    </Form>
  );
};
```

### Dynamic Field Arrays
```tsx
import { useFieldArray, useForm } from "react-hook-form";

const DynamicFieldsForm = () => {
  const { register, control } = useForm({
    defaultValues: {
      members: [{ name: "", email: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "members",
  });

  return (
    <Form>
      {fields.map((field, index) => (
        <div key={field.id} className="space-y-4 p-4 border border-arcane-slate rounded-lg">
          <FormField name={`members.${index}.name`} label="Name" required>
            <input type="text" {...register(`members.${index}.name`)} />
          </FormField>

          <FormField name={`members.${index}.email`} label="Email" required>
            <input type="email" {...register(`members.${index}.email`)} />
          </FormField>

          {index > 0 && (
            <button
              type="button"
              onClick={() => remove(index)}
              className="text-error hover:underline"
            >
              Remove
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        onClick={() => append({ name: "", email: "" })}
        className="text-arcane-yellow hover:underline"
      >
        + Add Member
      </button>

      <FormActions submitText="Save" />
    </Form>
  );
};
```

---

## Advanced Usage

### Form with Real-time Validation
```tsx
import { useForm } from "react-hook-form";
import { debounce } from "lodash";

const RealTimeValidationForm = () => {
  const {
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm({
    mode: "onChange", // Enable real-time validation
  });

  const validateUsername = debounce(async (username: string) => {
    if (username.length < 3) return;

    const available = await checkUsernameAvailability(username);
    if (!available) {
      setError("username", {
        type: "manual",
        message: "Username is already taken",
      });
    } else {
      clearErrors("username");
    }
  }, 500);

  const username = watch("username");

  React.useEffect(() => {
    if (username) {
      validateUsername(username);
    }
  }, [username]);

  return (
    <Form validateOnChange>
      <FormField
        name="username"
        label="Username"
        error={errors.username?.message}
        required
      >
        <input
          type="text"
          {...register("username", {
            required: "Username is required",
            minLength: {
              value: 3,
              message: "Username must be at least 3 characters",
            },
          })}
        />
      </FormField>
    </Form>
  );
};
```

### Form with File Upload
```tsx
const FileUploadForm = () => {
  const { register, handleSubmit } = useForm();
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data) => {
    const formData = new FormData();
    formData.append("avatar", data.avatar[0]);
    formData.append("name", data.name);

    await fetch("/api/profile", {
      method: "POST",
      body: formData,
    });
  };

  return (
    <Form onSubmit={handleSubmit(onSubmit)}>
      <FormField name="name" label="Name" required>
        <input type="text" {...register("name")} />
      </FormField>

      <FormField name="avatar" label="Profile Picture">
        <input
          type="file"
          accept="image/*"
          {...register("avatar")}
          onChange={handleFileChange}
        />
        {preview && (
          <img
            src={preview}
            alt="Preview"
            className="mt-2 w-24 h-24 rounded-full object-cover"
          />
        )}
      </FormField>

      <FormActions submitText="Save Profile" />
    </Form>
  );
};
```

---

## Best Practices

1. **Use React Hook Form** for complex forms with validation
2. **Use Zod** for type-safe schema validation
3. **Show loading states** during submission
4. **Handle API errors** gracefully with field-specific error messages
5. **Debounce async validation** to avoid excessive API calls
6. **Use FormField** for consistent field styling and error display
7. **Provide helpful error messages** that explain how to fix issues
8. **Use controlled components** for dynamic forms
9. **Test your forms** thoroughly with different inputs
10. **Consider accessibility** - use proper labels and ARIA attributes

---

## Troubleshooting

**Issue: Form submits with empty data**
- Ensure input elements have `name` attributes
- Check that inputs are inside the `<Form>` component

**Issue: Validation errors not showing**
- Verify error messages are passed to `FormField` or component `error` prop
- Check that validation is configured correctly in `register()` or schema

**Issue: Checkbox/Switch not updating**
- Use `watch()` and `setValue()` for controlled components
- Or use `defaultChecked` for uncontrolled components

**Issue: RadioGroup not working**
- Ensure all options have unique `value` props
- Check that `onValueChange` is updating the form state

---

## Additional Resources

- [React Hook Form Documentation](https://react-hook-form.com/)
- [Zod Documentation](https://zod.dev/)
- [Arcane Design System](./README.md)
- [Form Showcase Examples](./FormShowcase.tsx)
