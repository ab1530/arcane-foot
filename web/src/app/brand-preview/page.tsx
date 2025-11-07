import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function BrandPreview() {
  return (
    <main className="min-h-screen py-12">
      <div className="container-arcane space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-arcane-accent heading-spacing">
            ARCANE BRAND STYLEGUIDE
          </h1>
          <p className="text-arcane-grey">
            Preview of the Arcane Football brand identity implementation
          </p>
          <Link href="/">
            <Button variant="ghost">← Back to Home</Button>
          </Link>
        </div>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-arcane-accent heading-spacing text-2xl">
            COLOR PALETTE
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="space-y-3">
              <div className="h-32 bg-arcane-dark border border-arcane-darkBorder rounded-xl"></div>
              <div className="text-sm">
                <p className="font-bold">Primary Dark</p>
                <p className="text-arcane-grey">#080C1D</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 bg-arcane-accent rounded-xl"></div>
              <div className="text-sm">
                <p className="font-bold">Accent Fluorescent</p>
                <p className="text-arcane-grey">#E4FF3B</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 bg-arcane-grey rounded-xl"></div>
              <div className="text-sm">
                <p className="font-bold">Neutral Grey</p>
                <p className="text-arcane-grey">#9FA1A9</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-32 bg-white rounded-xl"></div>
              <div className="text-sm">
                <p className="font-bold">White</p>
                <p className="text-arcane-grey">#FFFFFF</p>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="space-y-6">
          <h2 className="text-arcane-accent heading-spacing text-2xl">
            TYPOGRAPHY
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-6">
              <div>
                <p className="text-arcane-grey text-sm mb-2">Headline / H1</p>
                <h1 className="text-arcane-accent">THE FUTURE OF FOOTBALL</h1>
              </div>
              <div>
                <p className="text-arcane-grey text-sm mb-2">Subtitle / H2</p>
                <h2>Performance & Precision</h2>
              </div>
              <div>
                <p className="text-arcane-grey text-sm mb-2">Section Title / H3</p>
                <h3>Empowering Athletes</h3>
              </div>
              <div>
                <p className="text-arcane-grey text-sm mb-2">Body Text</p>
                <p className="text-arcane-grey">
                  Arcane Football represents the pinnacle of professional football agency services,
                  combining cutting-edge technology with deep industry expertise to deliver
                  unparalleled results for our clients.
                </p>
              </div>
              <div>
                <p className="text-arcane-grey text-sm mb-2">Small Text</p>
                <p className="text-arcane-grey text-sm">
                  © 2025 Arcane Football GmbH. All rights reserved.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-arcane-accent heading-spacing text-2xl">
            BUTTON STYLES
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <p className="text-arcane-grey text-sm">Primary</p>
                  <Button className="w-full">Get Started</Button>
                </div>
                <div className="space-y-3">
                  <p className="text-arcane-grey text-sm">Secondary</p>
                  <Button variant="secondary" className="w-full">Learn More</Button>
                </div>
                <div className="space-y-3">
                  <p className="text-arcane-grey text-sm">Outline</p>
                  <Button variant="outline" className="w-full">Contact Us</Button>
                </div>
                <div className="space-y-3">
                  <p className="text-arcane-grey text-sm">Ghost</p>
                  <Button variant="ghost" className="w-full">View Details</Button>
                </div>
                <div className="space-y-3">
                  <p className="text-arcane-grey text-sm">Link</p>
                  <Button variant="link" className="w-full">Read More</Button>
                </div>
                <div className="space-y-3">
                  <p className="text-arcane-grey text-sm">Destructive</p>
                  <Button variant="destructive" className="w-full">Delete</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Cards */}
        <section className="space-y-6">
          <h2 className="text-arcane-accent heading-spacing text-2xl">
            CARD COMPONENTS
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="hover-glow">
              <CardHeader>
                <CardTitle>Standard Card</CardTitle>
                <CardDescription>
                  Card with title and description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-arcane-grey">
                  This is a standard card component with consistent spacing,
                  borders, and the Arcane brand styling applied.
                </p>
              </CardContent>
            </Card>

            <Card className="border-glow">
              <CardHeader>
                <CardTitle>Highlighted Card</CardTitle>
                <CardDescription>
                  Card with accent border glow
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-arcane-grey">
                  This card features the border-glow utility class for
                  emphasis and visual hierarchy.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Image Filter Demo */}
        <section className="space-y-6">
          <h2 className="text-arcane-accent heading-spacing text-2xl">
            IMAGE FILTER - COLD TONE
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-arcane-grey">
                All images automatically receive a cold tone filter (desaturated, bluish tint)
                to match the Arcane brand aesthetic. Use the <code className="bg-arcane-darkAlt px-2 py-1 rounded">no-filter</code> class
                to opt out.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm text-arcane-grey">With cold filter (default)</p>
                  <div className="h-48 bg-arcane-darkAlt rounded-xl flex items-center justify-center">
                    <p className="text-arcane-grey text-sm">[Image with filter]</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-arcane-grey">Without filter (.no-filter)</p>
                  <div className="h-48 bg-arcane-darkAlt rounded-xl flex items-center justify-center no-filter">
                    <p className="text-arcane-grey text-sm">[Original image]</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Spacing & Layout */}
        <section className="space-y-6">
          <h2 className="text-arcane-accent heading-spacing text-2xl">
            SPACING & LAYOUT
          </h2>
          <Card>
            <CardContent className="pt-6 space-y-4">
              <p className="text-arcane-grey">
                The design uses generous spacing (px-8, py-12) for a clean, breathable layout.
              </p>
              <ul className="list-disc list-inside space-y-2 text-arcane-grey">
                <li>Container max-width: 1280px (max-w-7xl)</li>
                <li>Section padding: 3rem vertical (py-12)</li>
                <li>Card border-radius: 1rem (rounded-2xl)</li>
                <li>Button border-radius: 0.5rem (rounded-lg)</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Design Principles */}
        <section className="space-y-6">
          <h2 className="text-arcane-accent heading-spacing text-2xl">
            DESIGN PRINCIPLES
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-arcane-grey text-sm">
                  Clean, minimal interfaces optimized for speed and efficiency
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Precision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-arcane-grey text-sm">
                  Structured layouts with consistent spacing and alignment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Power</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-arcane-grey text-sm">
                  Bold typography and strategic use of fluorescent accent
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-12 border-t border-arcane-darkBorder">
          <p className="text-arcane-grey">
            End of Brand Styleguide Preview
          </p>
          <Link href="/" className="inline-block mt-4">
            <Button variant="secondary">Return to Home</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
