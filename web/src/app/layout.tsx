import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClientProviders } from "@/components/providers/client-providers";
import { generateMetadata as generatePageMetadata, DEFAULT_VIEWPORT } from "@/lib/metadata";

// Load Inter font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// NOTE: Ananston fonts are not included in the repo
// When you obtain the font files, uncomment the code below and add:
// - /src/fonts/Ananston-Regular.woff2
// - /src/fonts/Ananston-Medium.woff2
// - /src/fonts/AnanstonExpanded-Medium.woff2
//
// For now, using Inter as the main font which still looks professional

// Use our advanced metadata system with Open Graph, Twitter Cards, and SEO optimization
export const metadata: Metadata = generatePageMetadata();

// Export viewport separately for Next.js 15+
export const viewport: Viewport = DEFAULT_VIEWPORT;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${inter.variable} font-inter antialiased`}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
