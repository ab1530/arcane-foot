/**
 * ARCANE FOOTBALL - ONBOARDING CONFIGURATION
 *
 * Defines role-specific onboarding flows to guide users through initial setup
 * and feature discovery.
 */

export interface OnboardingStep {
  key: string;
  order: number;
  title: string;
  description: string;
  icon?: string;
  isRequired: boolean;
  estimatedMinutes?: number;
  action?: {
    type: 'navigate' | 'modal' | 'tutorial';
    target: string;
  };
}

export interface OnboardingFlow {
  role: string;
  steps: OnboardingStep[];
  welcomeMessage: string;
  completionMessage: string;
}

/**
 * PLAYER ONBOARDING FLOW
 * Focus: Profile completion, media upload, visibility
 */
const PLAYER_FLOW: OnboardingFlow = {
  role: 'PLAYER',
  welcomeMessage:
    'Bienvenue sur Arcane Football! Créez votre profil de joueur professionnel et soyez découvert par des recruteurs du monde entier.',
  completionMessage:
    "Félicitations! Votre profil est configuré. Continuez à l'enrichir avec des vidéos et statistiques pour maximiser votre visibilité.",
  steps: [
    {
      key: 'complete_profile',
      order: 1,
      title: 'Complétez votre profil',
      description: 'Ajoutez vos informations personnelles, position, taille, poids et nationalité',
      icon: '👤',
      isRequired: true,
      estimatedMinutes: 3,
      action: {
        type: 'navigate',
        target: '/profile/edit',
      },
    },
    {
      key: 'add_photo',
      order: 2,
      title: 'Ajoutez une photo de profil',
      description: 'Une photo professionnelle améliore votre crédibilité auprès des recruteurs',
      icon: '📸',
      isRequired: true,
      estimatedMinutes: 2,
      action: {
        type: 'navigate',
        target: '/profile/edit',
      },
    },
    {
      key: 'upload_first_video',
      order: 3,
      title: 'Uploadez votre première vidéo',
      description: 'Montrez vos compétences avec des highlights de matchs ou entraînements',
      icon: '🎥',
      isRequired: false,
      estimatedMinutes: 5,
      action: {
        type: 'navigate',
        target: '/media/upload',
      },
    },
    {
      key: 'set_career_goals',
      order: 4,
      title: 'Définissez vos objectifs',
      description: 'Indiquez vos ambitions: championnat ciblé, type de club, niveau de compétition',
      icon: '🎯',
      isRequired: false,
      estimatedMinutes: 2,
      action: {
        type: 'modal',
        target: 'career_goals',
      },
    },
    {
      key: 'enable_visibility',
      order: 5,
      title: 'Activez votre visibilité',
      description: 'Rendez votre profil visible aux scouts et recruteurs',
      icon: '👁️',
      isRequired: true,
      estimatedMinutes: 1,
      action: {
        type: 'modal',
        target: 'visibility_settings',
      },
    },
  ],
};

/**
 * SCOUT ONBOARDING FLOW
 * Focus: Understanding tools, creating first report, assignment system
 */
const SCOUT_FLOW: OnboardingFlow = {
  role: 'SCOUT',
  welcomeMessage:
    'Bienvenue dans votre espace Scout! Découvrez nos outils professionnels pour analyser, évaluer et suivre les talents.',
  completionMessage:
    'Parfait! Vous êtes prêt à utiliser tous nos outils de scouting. Commencez à créer vos premiers rapports!',
  steps: [
    {
      key: 'tour_dashboard',
      order: 1,
      title: 'Découvrez le tableau de bord',
      description: 'Familiarisez-vous avec les statistiques, rapports récents et assignations',
      icon: '📊',
      isRequired: true,
      estimatedMinutes: 3,
      action: {
        type: 'tutorial',
        target: 'dashboard_tour',
      },
    },
    {
      key: 'create_first_report',
      order: 2,
      title: 'Créez votre premier rapport',
      description: 'Apprenez à évaluer un joueur avec notre système de notation complet',
      icon: '📝',
      isRequired: true,
      estimatedMinutes: 10,
      action: {
        type: 'navigate',
        target: '/scouting/create-report',
      },
    },
    {
      key: 'learn_kanban',
      order: 3,
      title: 'Découvrez le système Kanban',
      description: 'Organisez vos prospects dans un pipeline de recrutement visuel',
      icon: '📋',
      isRequired: false,
      estimatedMinutes: 5,
      action: {
        type: 'tutorial',
        target: 'kanban_tutorial',
      },
    },
    {
      key: 'set_preferences',
      order: 4,
      title: 'Configurez vos préférences',
      description: 'Définissez vos critères de recherche et notifications',
      icon: '⚙️',
      isRequired: false,
      estimatedMinutes: 3,
      action: {
        type: 'navigate',
        target: '/settings/preferences',
      },
    },
    {
      key: 'explore_ai_tools',
      order: 5,
      title: 'Explorez les outils IA',
      description: 'Découvrez ArkaneMatch et les suggestions intelligentes de joueurs',
      icon: '🤖',
      isRequired: false,
      estimatedMinutes: 5,
      action: {
        type: 'navigate',
        target: '/ai/arkane-match',
      },
    },
  ],
};

/**
 * CLUB_CONTACT ONBOARDING FLOW
 * Focus: Club profile, player discovery, request management
 */
const CLUB_CONTACT_FLOW: OnboardingFlow = {
  role: 'CLUB_CONTACT',
  welcomeMessage:
    'Bienvenue sur Arcane Football! Configurez votre club et commencez à découvrir les meilleurs talents.',
  completionMessage:
    'Excellent! Votre club est configuré. Commencez à explorer notre base de données de joueurs.',
  steps: [
    {
      key: 'setup_club_profile',
      order: 1,
      title: 'Configurez le profil du club',
      description: 'Ajoutez logo, stade, historique et informations de contact',
      icon: '⚽',
      isRequired: true,
      estimatedMinutes: 5,
      action: {
        type: 'navigate',
        target: '/club/edit',
      },
    },
    {
      key: 'discover_players',
      order: 2,
      title: 'Découvrez les joueurs',
      description:
        'Utilisez nos filtres avancés pour trouver les profils qui correspondent à vos besoins',
      icon: '🔍',
      isRequired: true,
      estimatedMinutes: 5,
      action: {
        type: 'navigate',
        target: '/players/search',
      },
    },
    {
      key: 'send_first_request',
      order: 3,
      title: 'Envoyez votre première demande',
      description: "Contactez un joueur pour un essai, une offre ou plus d'informations",
      icon: '📨',
      isRequired: false,
      estimatedMinutes: 3,
      action: {
        type: 'modal',
        target: 'send_request',
      },
    },
    {
      key: 'setup_camps',
      order: 4,
      title: 'Créez vos événements',
      description: 'Organisez des détections, stages ou showcases pour attirer les talents',
      icon: '🏕️',
      isRequired: false,
      estimatedMinutes: 7,
      action: {
        type: 'navigate',
        target: '/camps/create',
      },
    },
  ],
};

/**
 * AGENT ONBOARDING FLOW
 * Focus: Portfolio management, player representation, networking
 */
const AGENT_FLOW: OnboardingFlow = {
  role: 'AGENT',
  welcomeMessage:
    'Bienvenue Agent! Gérez votre portfolio de joueurs et connectez-les aux meilleures opportunités.',
  completionMessage:
    'Parfait! Vous pouvez maintenant gérer efficacement votre portfolio de joueurs.',
  steps: [
    {
      key: 'create_portfolio',
      order: 1,
      title: 'Créez votre portfolio',
      description: 'Ajoutez les joueurs que vous représentez et organisez-les',
      icon: '📁',
      isRequired: true,
      estimatedMinutes: 5,
      action: {
        type: 'navigate',
        target: '/agent/portfolio',
      },
    },
    {
      key: 'explore_opportunities',
      order: 2,
      title: 'Explorez les opportunités',
      description: 'Consultez les clubs actifs et leurs besoins en recrutement',
      icon: '🎯',
      isRequired: true,
      estimatedMinutes: 5,
      action: {
        type: 'navigate',
        target: '/opportunities',
      },
    },
    {
      key: 'manage_requests',
      order: 3,
      title: 'Gérez les demandes',
      description: 'Centralisez toutes les demandes de clubs pour vos joueurs',
      icon: '📬',
      isRequired: false,
      estimatedMinutes: 3,
      action: {
        type: 'navigate',
        target: '/agent/requests',
      },
    },
  ],
};

/**
 * PUBLIC/DEFAULT ONBOARDING FLOW
 * Focus: Platform discovery, subscription benefits
 */
const PUBLIC_FLOW: OnboardingFlow = {
  role: 'PUBLIC',
  welcomeMessage:
    'Bienvenue sur Arcane Football! Découvrez comment nous révolutionnons le recrutement dans le football.',
  completionMessage: 'Merci de votre intérêt! Explorez notre plateforme et découvrez nos offres.',
  steps: [
    {
      key: 'platform_overview',
      order: 1,
      title: 'Découvrez la plateforme',
      description: 'Comprenez comment Arcane Football connecte joueurs, scouts et clubs',
      icon: '🌟',
      isRequired: true,
      estimatedMinutes: 3,
      action: {
        type: 'tutorial',
        target: 'platform_overview',
      },
    },
    {
      key: 'explore_features',
      order: 2,
      title: 'Explorez les fonctionnalités',
      description: 'Base de données de joueurs, rapports de scouting, événements et plus',
      icon: '✨',
      isRequired: true,
      estimatedMinutes: 5,
      action: {
        type: 'tutorial',
        target: 'features_tour',
      },
    },
    {
      key: 'view_subscription_plans',
      order: 3,
      title: 'Découvrez nos offres',
      description: 'Comparez les abonnements et trouvez celui qui vous convient',
      icon: '💎',
      isRequired: false,
      estimatedMinutes: 2,
      action: {
        type: 'navigate',
        target: '/pricing',
      },
    },
  ],
};

/**
 * Get onboarding flow for a specific user role
 */
export function getOnboardingFlow(role: string): OnboardingFlow {
  switch (role) {
    case 'PLAYER':
      return PLAYER_FLOW;
    case 'SCOUT':
      return SCOUT_FLOW;
    case 'CLUB_CONTACT':
      return CLUB_CONTACT_FLOW;
    case 'AGENT':
      return AGENT_FLOW;
    case 'PUBLIC':
    default:
      return PUBLIC_FLOW;
  }
}

/**
 * Get all available onboarding flows
 */
export function getAllOnboardingFlows(): OnboardingFlow[] {
  return [PLAYER_FLOW, SCOUT_FLOW, CLUB_CONTACT_FLOW, AGENT_FLOW, PUBLIC_FLOW];
}
