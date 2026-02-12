/**
 * Form Components Showcase
 *
 * Comprehensive examples of all Form components
 * Arcane Design System - Tier 2 Composite Components
 */
import * as React from "react";
import {
  Form,
  FormField,
  FormActions,
  Checkbox,
  Radio,
  RadioGroup,
  Switch,
  type FormSubmitEvent,
} from "./index";

/**
 * Example 1: Basic Form with Validation
 */
export const BasicFormExample = () => {
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (submitEvent: FormSubmitEvent) => {
    setLoading(true);
    console.log("Form data:", submitEvent.data);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setLoading(false);
    alert("Form submitted successfully!");
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-arcane-charcoal rounded-lg">
      <h2 className="text-2xl font-bold text-arcane-yellow mb-6">Create Account</h2>

      <Form onSubmit={handleSubmit} loading={loading}>
        <FormField name="username" label="Username" required>
          <input
            type="text"
            name="username"
            className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg text-white focus:border-arcane-yellow focus:outline-none transition-colors"
            placeholder="Enter your username"
          />
        </FormField>

        <FormField
          name="email"
          label="Email"
          helperText="We'll never share your email"
          required
        >
          <input
            type="email"
            name="email"
            className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg text-white focus:border-arcane-yellow focus:outline-none transition-colors"
            placeholder="your@email.com"
          />
        </FormField>

        <FormField name="password" label="Password" required>
          <input
            type="password"
            name="password"
            className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-arcane-slate rounded-lg text-white focus:border-arcane-yellow focus:outline-none transition-colors"
            placeholder="Enter your password"
          />
        </FormField>

        <Checkbox
          name="terms"
          label="I agree to the terms and conditions"
          required
        />

        <Checkbox
          name="newsletter"
          label="Subscribe to newsletter"
          helperText="Get updates about new features"
        />

        <FormActions
          submitText="Create Account"
          cancelText="Cancel"
          onCancel={() => console.log("Cancelled")}
        />
      </Form>
    </div>
  );
};

/**
 * Example 2: Radio Group with Icons
 */
export const RadioGroupExample = () => {
  const [selectedPlan, setSelectedPlan] = React.useState("free");

  const planOptions = [
    {
      value: "free",
      label: "Free Plan",
      description: "Perfect for trying out",
      icon: (
        <svg className="w-5 h-5 text-arcane-gray-400" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" />
        </svg>
      ),
    },
    {
      value: "pro",
      label: "Pro Plan",
      description: "Best for individuals - $9/month",
      icon: (
        <svg className="w-5 h-5 text-arcane-yellow" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ),
    },
    {
      value: "team",
      label: "Team Plan",
      description: "For teams and organizations - $29/month",
      icon: (
        <svg className="w-5 h-5 text-arcane-yellow" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="max-w-2xl mx-auto p-8 bg-arcane-charcoal rounded-lg">
      <h2 className="text-2xl font-bold text-arcane-yellow mb-6">Choose Your Plan</h2>

      <RadioGroup
        name="plan"
        label="Select a subscription plan"
        options={planOptions}
        value={selectedPlan}
        onValueChange={setSelectedPlan}
        required
      />

      <div className="mt-6 p-4 bg-arcane-anthracite rounded-lg">
        <p className="text-sm text-arcane-gray-400">
          Selected: <span className="text-arcane-yellow font-semibold">{selectedPlan}</span>
        </p>
      </div>
    </div>
  );
};

/**
 * Example 3: Settings Form with Switches
 */
export const SettingsFormExample = () => {
  const [settings, setSettings] = React.useState({
    notifications: true,
    emailDigest: false,
    darkMode: true,
    autoSave: true,
  });

  const [loading, setLoading] = React.useState<string | null>(null);

  const handleToggle = async (key: string, value: boolean) => {
    setLoading(key);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSettings((prev) => ({ ...prev, [key]: value }));
    setLoading(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-8 bg-arcane-charcoal rounded-lg">
      <h2 className="text-2xl font-bold text-arcane-yellow mb-6">Settings</h2>

      <div className="space-y-6">
        <Switch
          name="notifications"
          label="Push Notifications"
          helperText="Receive notifications about important updates"
          checked={settings.notifications}
          loading={loading === "notifications"}
          onCheckedChange={(checked) => handleToggle("notifications", checked)}
          size="md"
        />

        <Switch
          name="emailDigest"
          label="Email Digest"
          helperText="Weekly summary of your activity"
          checked={settings.emailDigest}
          loading={loading === "emailDigest"}
          onCheckedChange={(checked) => handleToggle("emailDigest", checked)}
          size="md"
        />

        <Switch
          name="darkMode"
          label="Dark Mode"
          helperText="Use dark theme across the app"
          checked={settings.darkMode}
          loading={loading === "darkMode"}
          onCheckedChange={(checked) => handleToggle("darkMode", checked)}
          size="md"
        />

        <Switch
          name="autoSave"
          label="Auto Save"
          helperText="Automatically save your work"
          checked={settings.autoSave}
          loading={loading === "autoSave"}
          onCheckedChange={(checked) => handleToggle("autoSave", checked)}
          size="md"
        />
      </div>
    </div>
  );
};

/**
 * Example 4: Complex Form with All Components
 */
export const ComplexFormExample = () => {
  const [formState, setFormState] = React.useState({
    accountType: "personal",
    features: [] as string[],
    notifications: true,
  });

  const handleSubmit = async (submitEvent: FormSubmitEvent) => {
    console.log("Form submitted:", submitEvent.data);
    alert("Form submitted! Check console for data.");
  };

  return (
    <div className="max-w-3xl mx-auto p-8 bg-arcane-charcoal rounded-lg">
      <h2 className="text-2xl font-bold text-arcane-yellow mb-6">
        Complete Setup
      </h2>

      <Form onSubmit={handleSubmit} validateOnBlur>
        {/* Account Type */}
        <RadioGroup
          name="accountType"
          label="Account Type"
          options={[
            { value: "personal", label: "Personal", description: "For individual use" },
            { value: "business", label: "Business", description: "For companies" },
          ]}
          value={formState.accountType}
          onValueChange={(value) =>
            setFormState((prev) => ({ ...prev, accountType: value }))
          }
          direction="horizontal"
          required
        />

        {/* Feature Selection */}
        <FormField name="features" label="Select Features" required>
          <div className="space-y-3">
            <Checkbox name="analytics" label="Advanced Analytics" />
            <Checkbox name="reports" label="Custom Reports" />
            <Checkbox name="integrations" label="Third-party Integrations" />
            <Checkbox name="api" label="API Access" />
          </div>
        </FormField>

        {/* Notification Preferences */}
        <FormField name="notificationPrefs" label="Notification Preferences">
          <div className="space-y-4">
            <Switch
              name="emailNotifications"
              label="Email Notifications"
              size="md"
            />
            <Switch
              name="pushNotifications"
              label="Push Notifications"
              size="md"
            />
            <Switch
              name="smsNotifications"
              label="SMS Notifications"
              helperText="Standard rates may apply"
              size="md"
            />
          </div>
        </FormField>

        {/* Terms and Conditions */}
        <div className="border-t border-arcane-slate pt-6">
          <Checkbox
            name="terms"
            label="I agree to the Terms of Service and Privacy Policy"
            required
          />
          <Checkbox
            name="marketing"
            label="I want to receive marketing communications"
            helperText="You can unsubscribe at any time"
            className="mt-3"
          />
        </div>

        <FormActions
          submitText="Complete Setup"
          cancelText="Go Back"
          align="between"
          onCancel={() => console.log("Going back...")}
        >
          <button
            type="button"
            className="text-sm text-arcane-gray-400 hover:text-arcane-yellow transition-colors"
            onClick={() => console.log("Save as draft")}
          >
            Save as Draft
          </button>
        </FormActions>
      </Form>
    </div>
  );
};

/**
 * Example 5: Form with Sizes
 */
export const SizesExample = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-arcane-charcoal rounded-lg space-y-12">
      <div>
        <h3 className="text-xl font-bold text-arcane-yellow mb-4">Small Size</h3>
        <div className="space-y-4">
          <Checkbox name="small-cb" label="Small Checkbox" size="sm" />
          <RadioGroup
            name="small-radio"
            options={[
              { value: "1", label: "Option 1" },
              { value: "2", label: "Option 2" },
            ]}
            size="sm"
            direction="horizontal"
          />
          <Switch name="small-switch" label="Small Switch" size="sm" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-arcane-yellow mb-4">Medium Size (Default)</h3>
        <div className="space-y-4">
          <Checkbox name="medium-cb" label="Medium Checkbox" size="md" />
          <RadioGroup
            name="medium-radio"
            options={[
              { value: "1", label: "Option 1" },
              { value: "2", label: "Option 2" },
            ]}
            size="md"
            direction="horizontal"
          />
          <Switch name="medium-switch" label="Medium Switch" size="md" />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-arcane-yellow mb-4">Large Size</h3>
        <div className="space-y-4">
          <Checkbox name="large-cb" label="Large Checkbox" size="lg" />
          <RadioGroup
            name="large-radio"
            options={[
              { value: "1", label: "Option 1" },
              { value: "2", label: "Option 2" },
            ]}
            size="lg"
            direction="horizontal"
          />
          <Switch name="large-switch" label="Large Switch" size="lg" />
        </div>
      </div>
    </div>
  );
};

/**
 * Example 6: Error States
 */
export const ErrorStatesExample = () => {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-arcane-charcoal rounded-lg">
      <h2 className="text-2xl font-bold text-arcane-yellow mb-6">Error States</h2>

      <div className="space-y-6">
        <FormField
          name="username"
          label="Username"
          error="Username is already taken"
          required
        >
          <input
            type="text"
            name="username"
            className="w-full px-4 py-2 bg-arcane-anthracite border-2 border-error rounded-lg text-white focus:border-error focus:outline-none"
            placeholder="Enter username"
          />
        </FormField>

        <Checkbox
          name="terms-error"
          label="Accept terms and conditions"
          error="You must accept the terms to continue"
          required
        />

        <RadioGroup
          name="plan-error"
          label="Select a plan"
          options={[
            { value: "free", label: "Free" },
            { value: "pro", label: "Pro" },
          ]}
          error="Please select a plan"
          required
        />

        <Switch
          name="notifications-error"
          label="Enable notifications"
          error="Notifications must be enabled for this feature"
          required
        />
      </div>
    </div>
  );
};

/**
 * Example 7: Disabled States
 */
export const DisabledStatesExample = () => {
  return (
    <div className="max-w-2xl mx-auto p-8 bg-arcane-charcoal rounded-lg">
      <h2 className="text-2xl font-bold text-arcane-yellow mb-6">Disabled States</h2>

      <div className="space-y-6">
        <Checkbox
          name="disabled-cb"
          label="Disabled Checkbox"
          disabled
          helperText="This option is not available"
        />

        <Checkbox
          name="disabled-checked"
          label="Disabled Checked Checkbox"
          disabled
          checked
        />

        <RadioGroup
          name="disabled-radio"
          label="Disabled Radio Group"
          options={[
            { value: "1", label: "Option 1" },
            { value: "2", label: "Option 2", disabled: true },
            { value: "3", label: "Option 3" },
          ]}
          helperText="Option 2 is not available"
        />

        <Switch
          name="disabled-switch"
          label="Disabled Switch"
          disabled
          helperText="Feature not available in your plan"
        />
      </div>
    </div>
  );
};
