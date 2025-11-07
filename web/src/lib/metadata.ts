import { Metadata, Viewport } from 'next';

const DEFAULT_METADATA = {
  title: 'ARCANE Football - AI-Powered Scouting Platform',
  description: 'Professional football scouting and talent management platform powered by AI. Scout players, manage camps, generate reports, and discover the next football stars.',
  keywords: [
    'football scouting',
    'soccer scouting',
    'talent management',
    'AI scouting',
    'player analytics',
    'football camps',
    'scouting reports',
    'player recruitment',
    'talent discovery',
    'football AI',
    'sports analytics',
    'player evaluation',
  ],
  authors: [{ name: 'ARCANE Football GmbH' }],
  creator: 'ARCANE Football',
  publisher: 'ARCANE Football GmbH',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://arcane-football.com',
    siteName: 'ARCANE Football',
    title: 'ARCANE Football - AI-Powered Scouting Platform',
    description: 'Professional football scouting and talent management platform powered by AI.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'ARCANE Football Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ARCANE Football - AI-Powered Scouting Platform',
    description: 'Professional football scouting and talent management platform powered by AI.',
    images: ['/og-image.png'],
    creator: '@arcanefootball',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

// Separate viewport config for Next.js 15
export const DEFAULT_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

interface PageMetadataOptions {
  title?: string;
  description?: string;
  keywords?: string[];
  image?: string;
  url?: string;
  noIndex?: boolean;
}

export function generateMetadata(options: PageMetadataOptions = {}): Metadata {
  const {
    title,
    description,
    keywords = [],
    image,
    url,
    noIndex = false,
  } = options;

  const pageTitle = title
    ? `${title} | ARCANE Football`
    : DEFAULT_METADATA.title;

  const pageDescription = description || DEFAULT_METADATA.description;

  const pageKeywords = [
    ...DEFAULT_METADATA.keywords,
    ...keywords,
  ];

  const pageImage = image || DEFAULT_METADATA.openGraph.images[0].url;
  const pageUrl = url || DEFAULT_METADATA.openGraph.url;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: pageKeywords,
    authors: DEFAULT_METADATA.authors,
    creator: DEFAULT_METADATA.creator,
    publisher: DEFAULT_METADATA.publisher,
    openGraph: {
      ...DEFAULT_METADATA.openGraph,
      title: pageTitle,
      description: pageDescription,
      url: pageUrl,
      images: [
        {
          url: pageImage,
          width: 1200,
          height: 630,
          alt: title || 'ARCANE Football Platform',
        },
      ],
    },
    twitter: {
      ...DEFAULT_METADATA.twitter,
      title: pageTitle,
      description: pageDescription,
      images: [pageImage],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : (DEFAULT_METADATA.robots as Metadata["robots"]),
    icons: DEFAULT_METADATA.icons,
    manifest: DEFAULT_METADATA.manifest,
  };
}

// Page-specific metadata generators
export const pageMetadata = {
  home: () =>
    generateMetadata({
      title: 'Home',
      description:
        'Discover the next generation of football scouting with AI-powered analytics, comprehensive player evaluation, and professional camp management.',
      keywords: ['home', 'football scouting platform', 'AI scouting'],
    }),

  login: () =>
    generateMetadata({
      title: 'Login',
      description: 'Sign in to your ARCANE Football account to access professional scouting tools.',
      noIndex: true,
    }),

  signup: () =>
    generateMetadata({
      title: 'Sign Up',
      description: 'Create your ARCANE Football account and start scouting talent today.',
      noIndex: true,
    }),

  dashboard: () =>
    generateMetadata({
      title: 'Dashboard',
      description: 'Your personalized scouting dashboard with real-time analytics and insights.',
      noIndex: true,
    }),

  players: () =>
    generateMetadata({
      title: 'Players',
      description: 'Browse and evaluate football players with advanced filtering and AI-powered insights.',
      keywords: ['player database', 'player search', 'talent discovery'],
    }),

  clubs: () =>
    generateMetadata({
      title: 'Clubs',
      description: 'Explore football clubs worldwide and their player rosters.',
      keywords: ['football clubs', 'club database', 'team management'],
    }),

  reports: () =>
    generateMetadata({
      title: 'Scouting Reports',
      description: 'Create and manage professional scouting reports with detailed player evaluations.',
      keywords: ['scouting reports', 'player evaluation', 'talent assessment'],
    }),

  calendar: () =>
    generateMetadata({
      title: 'Match Calendar',
      description: 'Manage your scouting schedule with our interactive match calendar.',
      keywords: ['match calendar', 'scouting schedule', 'match planning'],
    }),

  market: () =>
    generateMetadata({
      title: 'Transfer Market',
      description: 'Track player transfers and manage your recruitment pipeline with our Kanban board.',
      keywords: ['transfer market', 'player recruitment', 'talent pipeline'],
    }),

  camps: () =>
    generateMetadata({
      title: 'Football Camps',
      description: 'Discover and register for football camps, tryouts, and showcases.',
      keywords: ['football camps', 'tryouts', 'showcases', 'player development'],
    }),

  ai: () =>
    generateMetadata({
      title: 'AI Tools',
      description: 'Access AI-powered scouting tools including player ratings, chatbot, and automated reports.',
      keywords: ['AI scouting', 'player AI', 'football AI', 'automated scouting'],
    }),

  pricing: () =>
    generateMetadata({
      title: 'Pricing',
      description: 'Choose the perfect plan for your scouting needs. From free to enterprise solutions.',
      keywords: ['pricing', 'subscription plans', 'scouting plans'],
    }),

  about: () =>
    generateMetadata({
      title: 'About Us',
      description: 'Learn about ARCANE Football and our mission to revolutionize football scouting with AI.',
      keywords: ['about', 'company', 'mission'],
    }),

  contact: () =>
    generateMetadata({
      title: 'Contact Us',
      description: 'Get in touch with our team for support, partnerships, or inquiries.',
      keywords: ['contact', 'support', 'help'],
    }),

  profile: () =>
    generateMetadata({
      title: 'Profile',
      description: 'Manage your profile and account settings.',
      noIndex: true,
    }),

  analytics: () =>
    generateMetadata({
      title: 'Analytics',
      description: 'View detailed analytics and insights about your scouting activity.',
      keywords: ['analytics', 'statistics', 'insights'],
      noIndex: true,
    }),

  myCamps: () =>
    generateMetadata({
      title: 'My Camps',
      description: 'Manage your camp registrations and participation.',
      keywords: ['my camps', 'registrations', 'participation'],
      noIndex: true,
    }),

  membership: () =>
    generateMetadata({
      title: 'Membership',
      description: 'Manage your subscription and membership benefits.',
      keywords: ['membership', 'subscription', 'account'],
      noIndex: true,
    }),

  services: () =>
    generateMetadata({
      title: 'Services',
      description: 'Discover our range of professional football scouting services.',
      keywords: ['services', 'features', 'offerings'],
    }),
};

// JSON-LD Structured Data
export const structuredData = {
  organization: {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'ARCANE Football',
    alternateName: 'Arcane Football GmbH',
    url: 'https://arcane-football.com',
    logo: 'https://arcane-football.com/logo.png',
    description: 'Professional football scouting and talent management platform powered by AI.',
    sameAs: [
      'https://twitter.com/arcanefootball',
      'https://linkedin.com/company/arcane-football',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@arcane.football',
      availableLanguage: ['English', 'French', 'German'],
    },
  },

  website: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'ARCANE Football',
    url: 'https://arcane-football.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://arcane-football.com/search?q={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  },

  softwareApplication: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'ARCANE Football Platform',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'EUR',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: '127',
    },
  },
};
