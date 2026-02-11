/**
 * SEO Metadata Utilities
 * Centralized SEO configuration for all pages
 */

import { Metadata } from 'next';

export const siteConfig = {
  name: 'Arcane Football',
  description: 'Plateforme de gestion d\'agence de football alimentée par l\'IA - Scouting, analyse et gestion de joueurs professionnels',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://arcane.football',
  ogImage: '/og-image.png',
  links: {
    twitter: 'https://twitter.com/arcanefootball',
    github: 'https://github.com/arcane-football',
  },
};

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  noIndex?: boolean;
  keywords?: string[];
  type?: 'website' | 'article' | 'profile';
  publishedTime?: string;
  authors?: string[];
  canonical?: string;
}

export function generateMetadata({
  title,
  description = siteConfig.description,
  image = siteConfig.ogImage,
  noIndex = false,
  keywords = [],
  type = 'website',
  publishedTime,
  authors,
  canonical,
}: SEOProps = {}): Metadata {
  const pageTitle = title ? `${title} | ${siteConfig.name}` : siteConfig.name;
  const imageUrl = image.startsWith('http') ? image : `${siteConfig.url}${image}`;
  const canonicalUrl = canonical || siteConfig.url;

  const defaultKeywords = [
    'football',
    'soccer',
    'scouting',
    'player management',
    'football agency',
    'AI football',
    'player analytics',
    'football platform',
  ];

  return {
    title: pageTitle,
    description,
    keywords: [...defaultKeywords, ...keywords],
    authors: authors?.map(name => ({ name })),
    creator: siteConfig.name,
    publisher: siteConfig.name,
    formatDetection: {
      telephone: false,
      email: false,
      address: false,
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
        }
      : {
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
    openGraph: {
      type,
      title: pageTitle,
      description,
      url: canonicalUrl,
      siteName: siteConfig.name,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: title || siteConfig.name,
        },
      ],
      locale: 'fr_FR',
      ...(type === 'article' && publishedTime
        ? {
            publishedTime,
          }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description,
      images: [imageUrl],
      creator: '@arcanefootball',
    },
    alternates: {
      canonical: canonicalUrl,
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
  };
}

// Page-specific metadata
export const pageMetadata = {
  home: generateMetadata({
    title: 'Accueil',
    description:
      'Plateforme de scouting et gestion de joueurs alimentée par l\'IA. Découvrez, analysez et gérez les talents du football professionnel avec Arcane Football.',
    keywords: ['accueil', 'platform', 'football management', 'AI scouting'],
  }),

  dashboard: generateMetadata({
    title: 'Dashboard',
    description:
      'Tableau de bord de gestion - Vue d\'ensemble de vos joueurs, rapports de scouting et activités récentes.',
    keywords: ['dashboard', 'overview', 'statistics', 'analytics'],
    noIndex: true,
  }),

  players: generateMetadata({
    title: 'Joueurs',
    description:
      'Découvrez notre base de données de joueurs professionnels. Filtrez par position, nationalité, club et explorez les profils détaillés.',
    keywords: ['players', 'database', 'profiles', 'search', 'filter'],
  }),

  camps: generateMetadata({
    title: 'Camps & Showcases',
    description:
      'Participez à des camps de football et showcases pour développer vos compétences et vous faire repérer par des scouts professionnels.',
    keywords: ['camps', 'showcases', 'training', 'development', 'recruitment'],
  }),

  market: generateMetadata({
    title: 'Marché des Transferts',
    description:
      'Explorez le marché des transferts, consultez les demandes des clubs et découvrez les opportunités de recrutement.',
    keywords: ['market', 'transfers', 'recruitment', 'club requests', 'deals'],
  }),

  reports: generateMetadata({
    title: 'Rapports de Scouting',
    description:
      'Consultez et créez des rapports de scouting détaillés avec analyse vidéo, statistiques et évaluations professionnelles.',
    keywords: ['scouting', 'reports', 'analysis', 'evaluation', 'video analysis'],
  }),

  ai: generateMetadata({
    title: 'Arkane AI Hub',
    description:
      'Intelligence artificielle pour le football - ArkaneIndex, ArkaneGPT et outils d\'analyse alimentés par l\'IA.',
    keywords: ['AI', 'artificial intelligence', 'analytics', 'matchmaking', 'automation'],
  }),

  pricing: generateMetadata({
    title: 'Tarifs & Abonnements',
    description:
      'Choisissez le plan qui correspond à vos besoins - Scout, Agent ou Agence. Accédez aux fonctionnalités IA et outils professionnels.',
    keywords: ['pricing', 'plans', 'subscription', 'tiers', 'features'],
  }),

  about: generateMetadata({
    title: 'À Propos',
    description:
      'Découvrez Arcane Football - Notre mission, notre équipe et notre vision pour révolutionner le scouting avec l\'IA.',
    keywords: ['about', 'team', 'mission', 'vision', 'company'],
  }),

  contact: generateMetadata({
    title: 'Contact',
    description:
      'Contactez l\'équipe Arcane Football - Support, partenariats et demandes commerciales.',
    keywords: ['contact', 'support', 'help', 'partnerships', 'sales'],
  }),

  login: generateMetadata({
    title: 'Connexion',
    description: 'Connectez-vous à votre compte Arcane Football pour accéder à la plateforme.',
    keywords: ['login', 'sign in', 'authentication'],
    noIndex: true,
  }),

  signup: generateMetadata({
    title: 'Inscription',
    description: 'Créez votre compte Arcane Football et commencez à utiliser la plateforme.',
    keywords: ['signup', 'register', 'create account'],
    noIndex: true,
  }),

  profile: generateMetadata({
    title: 'Mon Profil',
    description: 'Gérez votre profil et paramètres de compte.',
    keywords: ['profile', 'settings', 'account'],
    noIndex: true,
  }),

  analytics: generateMetadata({
    title: 'Analytiques',
    description: 'Analysez vos données avec des tableaux de bord et rapports détaillés.',
    keywords: ['analytics', 'statistics', 'insights', 'reports'],
    noIndex: true,
  }),

  calendar: generateMetadata({
    title: 'Calendrier',
    description: 'Gérez vos matchs, événements et missions de scouting.',
    keywords: ['calendar', 'schedule', 'matches', 'events'],
    noIndex: true,
  }),

  membership: generateMetadata({
    title: 'Adhésion',
    description: 'Gérez votre abonnement et accédez aux fonctionnalités premium.',
    keywords: ['membership', 'subscription', 'premium'],
    noIndex: true,
  }),
};

// JSON-LD structured data
export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.name,
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    sameAs: [siteConfig.links.twitter, siteConfig.links.github],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'support@arcane.football',
    },
  };
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generatePersonSchema(person: {
  name: string;
  jobTitle: string;
  image?: string;
  description?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: person.name,
    jobTitle: person.jobTitle,
    ...(person.image ? { image: person.image } : {}),
    ...(person.description ? { description: person.description } : {}),
  };
}
