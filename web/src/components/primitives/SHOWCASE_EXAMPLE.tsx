/**
 * Arcane Primitives Showcase
 *
 * This file demonstrates all Tier 1 primitive components
 * in a comprehensive example page.
 */

import React from 'react';
import {
  ArcaneButton,
  IconButton,
  ArcaneCard,
  CardHeader,
  CardContent,
  CardFooter,
  ArcaneInput,
  Badge,
  Heading,
  Text,
  GradientText,
} from '@/components/primitives';
import {
  Search,
  Heart,
  Share2,
  Mail,
  Lock,
  Bell,
  Settings,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Star,
} from 'lucide-react';

export function PrimitivesShowcase() {
  return (
    <div className="min-h-screen bg-arcane-black p-8 space-y-12">
      {/* Header Section */}
      <section className="space-y-4">
        <Heading level={1} gradient>
          Arcane Design System
        </Heading>
        <Text size="lg" color="secondary">
          Tier 1 Primitives - Premium UI Components
        </Text>
      </section>

      {/* Buttons Section */}
      <section className="space-y-6">
        <Heading level={2}>Buttons</Heading>

        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <ArcaneButton variant="primary" size="sm">
              Small Primary
            </ArcaneButton>
            <ArcaneButton variant="primary" size="md">
              Medium Primary
            </ArcaneButton>
            <ArcaneButton variant="primary" size="lg">
              Large Primary
            </ArcaneButton>
          </div>

          <div className="flex gap-3 items-center">
            <ArcaneButton variant="primary" icon={<Search />}>
              With Icon
            </ArcaneButton>
            <ArcaneButton variant="secondary" icon={<Heart />}>
              Secondary
            </ArcaneButton>
            <ArcaneButton variant="ghost" icon={<Settings />}>
              Ghost
            </ArcaneButton>
            <ArcaneButton variant="danger" icon={<AlertTriangle />}>
              Danger
            </ArcaneButton>
          </div>

          <div className="flex gap-3 items-center">
            <ArcaneButton variant="primary" loading>
              Loading...
            </ArcaneButton>
            <ArcaneButton variant="primary" disabled>
              Disabled
            </ArcaneButton>
          </div>

          <Text size="sm" color="tertiary">Icon Buttons</Text>
          <div className="flex gap-3 items-center">
            <IconButton icon={<Heart />} variant="primary" aria-label="Like" />
            <IconButton icon={<Share2 />} variant="secondary" aria-label="Share" />
            <IconButton icon={<Bell />} variant="ghost" badge={3} aria-label="Notifications" />
            <IconButton icon={<Settings />} variant="ghost" aria-label="Settings" />
          </div>
        </div>
      </section>

      {/* Cards Section */}
      <section className="space-y-6">
        <Heading level={2}>Cards</Heading>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Standard Card */}
          <ArcaneCard variant="standard" hover glow>
            <CardHeader>
              <Heading level={4}>Standard Card</Heading>
            </CardHeader>
            <CardContent>
              <Text color="secondary">
                This is a standard card with hover effects and glow.
              </Text>
            </CardContent>
            <CardFooter>
              <ArcaneButton size="sm" fullWidth>
                Action
              </ArcaneButton>
            </CardFooter>
          </ArcaneCard>

          {/* Glass Card */}
          <ArcaneCard variant="glass" hover>
            <CardHeader>
              <Heading level={4}>Glass Card</Heading>
            </CardHeader>
            <CardContent>
              <Text color="secondary">
                Glass morphism effect with backdrop blur.
              </Text>
            </CardContent>
          </ArcaneCard>

          {/* Feature Card */}
          <ArcaneCard variant="feature">
            <CardHeader>
              <Heading level={4}>Feature Card</Heading>
            </CardHeader>
            <CardContent>
              <Text color="secondary">
                Featured content with yellow accent border.
              </Text>
            </CardContent>
          </ArcaneCard>

          {/* Stat Card */}
          <ArcaneCard variant="stat" gradient>
            <CardContent>
              <Text size="xs" color="tertiary">TOTAL PLAYERS</Text>
              <Heading level={2}>1,234</Heading>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="success" size="sm" icon={<TrendingUp />}>
                  +12%
                </Badge>
                <Text size="xs" color="tertiary">vs last month</Text>
              </div>
            </CardContent>
          </ArcaneCard>
        </div>
      </section>

      {/* Inputs Section */}
      <section className="space-y-6">
        <Heading level={2}>Inputs</Heading>

        <div className="max-w-md space-y-4">
          <ArcaneInput
            type="text"
            label="Full Name"
            placeholder="Enter your name"
            icon={<Search />}
          />

          <ArcaneInput
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            icon={<Mail />}
            helperText="We'll never share your email"
          />

          <ArcaneInput
            type="password"
            label="Password"
            placeholder="Enter password"
            icon={<Lock />}
          />

          <ArcaneInput
            type="text"
            label="Search"
            placeholder="Search players..."
            icon={<Search />}
            clearable
          />

          <ArcaneInput
            type="email"
            label="Email (with error)"
            value="invalid-email"
            error="Please enter a valid email address"
          />
        </div>
      </section>

      {/* Badges Section */}
      <section className="space-y-6">
        <Heading level={2}>Badges</Heading>

        <div className="space-y-4">
          <div className="flex gap-3 flex-wrap">
            <Badge variant="success" icon={<CheckCircle />}>
              Active
            </Badge>
            <Badge variant="warning" icon={<AlertTriangle />}>
              Pending
            </Badge>
            <Badge variant="error">
              Inactive
            </Badge>
            <Badge variant="info">
              New
            </Badge>
            <Badge variant="premium" icon={<Star />}>
              Premium
            </Badge>
          </div>

          <Text size="sm" color="tertiary">Different Sizes</Text>
          <div className="flex gap-3 items-center">
            <Badge variant="success" size="sm">Small</Badge>
            <Badge variant="success" size="md">Medium</Badge>
            <Badge variant="success" size="lg">Large</Badge>
          </div>
        </div>
      </section>

      {/* Typography Section */}
      <section className="space-y-6">
        <Heading level={2}>Typography</Heading>

        <div className="space-y-4">
          <div className="space-y-2">
            <Text size="xs" color="tertiary">Headings</Text>
            <Heading level={1}>Heading 1</Heading>
            <Heading level={2}>Heading 2</Heading>
            <Heading level={3}>Heading 3</Heading>
            <Heading level={4}>Heading 4</Heading>
            <Heading level={5}>Heading 5</Heading>
            <Heading level={6}>Heading 6</Heading>
          </div>

          <div className="space-y-2">
            <Text size="xs" color="tertiary">Gradient Headings</Text>
            <Heading level={2} gradient>
              Primary Gradient
            </Heading>
            <Heading level={2} gradient gradientType="ai">
              AI Gradient
            </Heading>
            <Heading level={2} gradient gradientType="performance">
              Performance Gradient
            </Heading>
            <Heading level={2} gradient gradientType="premium">
              Premium Gradient
            </Heading>
          </div>

          <div className="space-y-2">
            <Text size="xs" color="tertiary">Text Variants</Text>
            <Text size="xl">Extra Large Text</Text>
            <Text size="lg">Large Text</Text>
            <Text size="md">Medium Text (Default)</Text>
            <Text size="sm">Small Text</Text>
            <Text size="xs">Extra Small Text</Text>
          </div>

          <div className="space-y-2">
            <Text size="xs" color="tertiary">Text Colors</Text>
            <Text color="primary">Primary Text</Text>
            <Text color="secondary">Secondary Text</Text>
            <Text color="tertiary">Tertiary Text</Text>
            <Text color="accent">Accent Text</Text>
          </div>

          <div className="space-y-2">
            <Text size="xs" color="tertiary">Gradient Text</Text>
            <Text size="lg">
              Welcome to <GradientText gradient="primary">Arcane</GradientText>
            </Text>
            <Text size="lg">
              Powered by <GradientText gradient="ai">AI Technology</GradientText>
            </Text>
          </div>
        </div>
      </section>

      {/* Complete Example */}
      <section className="space-y-6">
        <Heading level={2}>Complete Example: Player Card</Heading>

        <div className="max-w-md">
          <ArcaneCard variant="standard" hover glow>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Heading level={3}>Lionel Messi</Heading>
                <IconButton icon={<Heart />} variant="ghost" aria-label="Favorite" />
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="success" icon={<TrendingUp />}>
                    Forward
                  </Badge>
                  <Badge variant="info">Age 36</Badge>
                  <Badge variant="premium" icon={<Star />}>
                    Premium
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Text size="xs" color="tertiary">Goals</Text>
                    <Text size="xl" weight="bold">32</Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">Assists</Text>
                    <Text size="xl" weight="bold">28</Text>
                  </div>
                  <div>
                    <Text size="xs" color="tertiary">Rating</Text>
                    <Text size="xl" weight="bold" color="accent">9.5</Text>
                  </div>
                </div>

                {/* Description */}
                <Text size="sm" color="secondary">
                  World-class forward with exceptional technical skills and
                  game intelligence. One of the greatest players of all time.
                </Text>

                {/* AI Insight */}
                <div className="p-3 bg-ai/10 rounded-lg border border-ai/20">
                  <Text size="xs" weight="semibold">
                    <GradientText gradient="ai">AI Insight</GradientText>
                  </Text>
                  <Text size="sm" color="secondary">
                    Peak performance in final third. Exceptional dribbling and
                    passing accuracy make him a constant threat.
                  </Text>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <ArcaneButton variant="primary" size="sm" fullWidth icon={<Search />}>
                View Full Profile
              </ArcaneButton>
              <IconButton icon={<Share2 />} variant="ghost" aria-label="Share" />
            </CardFooter>
          </ArcaneCard>
        </div>
      </section>

      {/* Footer */}
      <section className="pt-12 border-t border-arcane-slate">
        <Text size="sm" color="tertiary" as="div" className="text-center">
          Arcane Design System v2.0 • Tier 1 Primitives
        </Text>
      </section>
    </div>
  );
}

export default PrimitivesShowcase;
