export const fr = {
  common: {
    language: {
      title: 'Langue de l\'application',
      description: 'Choisissez la langue par défaut pour tous les écrans, notifications et emails.',
      notice: 'La préférence est synchronisée entre le web et le mobile lorsque vous utilisez le même compte.',
      options: {
        fr: 'Français',
        en: 'Anglais',
      },
    },
    actions: {
      cancel: 'Annuler',
      confirm: 'Confirmer',
      close: 'Fermer',
      logout: 'Se déconnecter',
      back: 'Retour',
      next: 'Suivant',
      retry: 'Réessayer',
      save: 'Enregistrer',
      delete: 'Supprimer',
      comingSoonTitle: 'Bientôt disponible',
      comingSoonBody: 'Cette section est en cours de finalisation. Revenez très vite !',
    },
    feedback: {
      success: 'Succès',
      error: 'Erreur',
      warning: 'Attention',
      info: 'Information',
    },
    notAvailable: 'N/A',
    versus: 'vs',
  },
  auth: {
    login: {
      appName: 'Arcane Football',
      tagline: 'Plateforme de Scouting Professionnel',
      title: 'Connexion',
      inputs: {
        email: 'Email',
        password: 'Mot de passe',
      },
      forgot: 'Mot de passe oublié ?',
      forgotTitle: 'Mot de passe oublié',
      forgotMessage: 'La réinitialisation du mot de passe sera bientôt disponible',
      forgotConfirm: 'OK',
      button: 'Se connecter',
      noAccount: 'Pas encore de compte ?',
      signupCta: 'Créer un compte',
      testCredentials: 'Test: admin@arcane.com / (mot de passe de démo fourni séparément)',
      toasts: {
        missingFields: 'Veuillez remplir tous les champs',
        success: 'Connexion réussie !',
        invalidCredentials: 'Email ou mot de passe incorrect',
        network: 'Erreur de connexion au serveur',
        generic: 'Une erreur est survenue',
      },
    },
    signup: {
      title: 'Créer un compte',
      subtitle: 'Rejoins la plateforme Arcane',
      inputs: {
        firstName: 'Prénom',
        lastName: 'Nom',
        email: 'Email',
        password: 'Mot de passe',
        confirmPassword: 'Confirmer le mot de passe',
      },
      placeholders: {
        firstName: 'Abdou',
        lastName: 'Lakhdari',
        email: 'club@arcane.gg',
        password: '••••••••',
        confirmPassword: '••••••••',
      },
      errors: {
        mismatch: 'Les mots de passe ne correspondent pas',
        generic: 'Une erreur est survenue pendant la création du compte',
      },
      button: 'Créer mon compte',
      haveAccount: 'Déjà inscrit ? Se connecter',
    },
  },
  dashboard: {
    loading: 'Chargement du tableau de bord…',
    hero: {
      greeting: 'Bon retour,',
      level: 'Niveau {{level}}',
      xp: '{{current}} / {{next}} XP',
      defaultName: 'Scout Arcane',
    },
    stats: {
      cards: [
        {
          key: 'reports',
          title: 'Rapports',
          trendLabel: 'vs la semaine dernière',
        },
        {
          key: 'players',
          title: 'Joueurs scoutés',
          trendLabel: 'ce mois-ci',
        },
        {
          key: 'matches',
          title: 'Matchs suivis',
          trendLabel: 'cette semaine',
        },
        {
          key: 'xp',
          title: 'XP total',
          trendLabel: 'aujourd’hui',
        },
      ],
    },
    quickActions: {
      title: 'Actions rapides',
      items: [
        { icon: 'add-circle', label: 'Nouveau rapport', target: 'CreateReport', variant: 'primary' },
        { icon: 'search', label: 'Recherche Globale', target: 'GlobalSearch' },
        { icon: 'analytics', label: 'Voir les analytics', target: 'Analytics' },
        { icon: 'sparkles', label: 'Assistant IA', target: 'AI' },
        { icon: 'flag', label: "Camps d'entraînement", target: 'Camps' },
      ],
    },
    player: {
      profileTitle: 'Résumé du profil',
      profileNameLabel: 'Nom',
      profilePositionLabel: 'Poste',
      profileAgeLabel: 'Âge',
      performanceTitle: 'Performance',
      sessionsTitle: "Séances d'entraînement",
      distanceLabel: 'Distance',
      durationLabel: 'Durée',
      maxSpeedLabel: 'Vitesse max',
      viewAllLabel: 'Voir tout',
      viewSessionsCta: 'Voir les sessions',
      emptySessions: 'Aucune session disponible',
      notProvided: 'Non renseigné',
      shareButton: 'Partager mon profil',
      shareTitle: 'Partager mon profil',
      sharePlaceholder: 'Action disponible bientôt',
      braceletTitle: 'Bracelet QC Band',
      braceletIosLabel: 'Live iOS',
      braceletIosOnlyLabel: 'iOS seulement',
      braceletStateUnsupported: 'Live bracelet disponible sur iOS',
      braceletStateDisconnected: 'Bracelet déconnecté',
      braceletStateConnecting: 'Connexion en cours...',
      braceletStateConnected: 'Bracelet connecté',
      braceletStateError: 'Bracelet indisponible',
      braceletBatteryLabel: 'Batterie',
      braceletStepsLabel: 'Pas',
      braceletDistanceLabel: 'Distance',
      braceletHrLabel: 'FC',
      braceletLastSyncLabel: 'Sync',
      braceletConnectCta: 'Connecter',
      braceletConnectingCta: 'Connexion...',
      braceletRefreshCta: 'Rafraîchir',
      braceletOpenCta: 'Mon bracelet',
      braceletAndroidCta: 'Voir sessions',
    },
    ai: {
      sectionTitle: 'Insights IA',
      cardTitle: 'Recommandations de talents',
      subtitle: 'Propulsé par Arcane AI',
      descriptionWithData: 'L’IA a identifié {{count}} joueurs prometteurs selon vos critères.',
      descriptionEmpty: 'Commencez à scouter pour obtenir des insights IA.',
      cta: 'Obtenir les insights IA',
    },
    challenge: {
      title: 'Défi du jour',
      button: 'Terminer le défi',
      xpLabel: '+{{xp}} XP',
      sample: {
        title: 'Compléter 3 rapports',
        description: 'Soumettez trois rapports complets aujourd’hui',
      },
    },
    activity: {
      title: 'Activité récente',
      viewAll: 'Voir tout',
      samples: [
        {
          id: 'act-1',
          icon: 'document-text',
          iconColor: '#E4FF3B',
          title: 'Rapport créé',
          description: 'Nouveau rapport pour un attaquant U19',
          timestamp: 'Il y a 2 heures',
        },
        {
          id: 'act-2',
          icon: 'people',
          iconColor: '#3B82F6',
          title: 'Joueur scouté',
          description: 'Ajouté à votre base de données',
          timestamp: 'Il y a 5 heures',
        },
        {
          id: 'act-3',
          icon: 'football',
          iconColor: '#10B981',
          title: 'Match couvert',
          description: 'Session de scouting réussie',
          timestamp: 'Hier',
        },
        {
          id: 'act-4',
          icon: 'trophy',
          iconColor: '#F59E0B',
          title: 'Succès débloqué',
          description: 'Badge Expert Scout obtenu',
          timestamp: 'Il y a 2 jours',
        },
        {
          id: 'act-5',
          icon: 'trending-up',
          iconColor: '#06B6D4',
          title: 'Stats mises à jour',
          description: 'Vos métriques ont été recalculées',
          timestamp: 'Il y a 3 jours',
        },
      ],
    },
    matches: {
      title: 'Matchs à venir',
      viewAll: 'Voir tout',
      vs: 'vs',
      samples: [
        { id: 'match-1', homeTeam: 'FC Barcelone', awayTeam: 'Real Madrid', date: 'Demain', time: '20:00' },
        { id: 'match-2', homeTeam: 'Manchester United', awayTeam: 'Liverpool', date: 'Samedi', time: '15:00' },
        { id: 'match-3', homeTeam: 'Bayern Munich', awayTeam: 'Dortmund', date: 'Dimanche', time: '18:30' },
      ],
    },
  },
  profile: {
    header: {
      title: 'Mon profil',
      subtitle: 'Optimisez votre identité professionnelle Arcane',
      stats: {
        reports: 'Rapports',
        players: 'Joueurs',
        success: 'Succès',
        rating: 'Note',
      },
    },
    quickSettings: {
      title: 'Réglages rapides',
      notifications: {
        title: 'Notifications push',
        subtitle: 'Recevez les alertes de nouveaux rapports',
      },
      darkMode: {
        title: 'Mode sombre',
        subtitle: 'Repose vos yeux la nuit',
      },
      haptics: {
        title: 'Retour haptique',
        subtitle: 'Vibration lors des interactions',
      },
    },
    logout: {
      title: 'Déconnexion',
      message: 'Voulez-vous vraiment vous déconnecter ?',
      confirm: 'Déconnexion',
    },
    menu: {
      settings: 'Paramètres',
      membership: 'Abonnement',
      passport: 'Mon Passport',
      account: 'Paramètres du compte',
      subscription: 'Abonnement',
      privacy: 'Confidentialité & Sécurité',
      support: 'Aide & Support',
      about: 'À propos d’Arcane',
      logout: 'Déconnexion',
    },
    cards: {
      subscriptionComingSoon: 'La gestion détaillée des abonnements arrive bientôt sur mobile.',
      privacyComingSoon: 'Gestion avancée de la confidentialité disponible prochainement.',
      supportComingSoon: 'Centre d’aide en cours d’intégration.',
    },
    about: {
      message: 'Arcane Football \nVersion 1.0.0 • 2025 \nTous droits réservés.',
    },
    language: {
      title: 'Langue & Région',
      description: 'Les écrans et notifications sont affichés en français par défaut. Vous pouvez basculer sur l’anglais à tout moment.',
      sync: 'Synchronisé avec votre compte',
      realtime: 'Changement instantané',
    },
    fallbacks: {
      displayName: 'Scout Arcane',
      username: 'arcane-user',
      role: 'Scout Arcane',
      avatarInitial: 'A',
    },
    alerts: {
      editProfile: {
        title: 'Bientôt disponible',
        description: 'La modification du profil arrive très bientôt.',
      },
    },
  },
  membership: {
    hero: {
      eyebrow: 'Programmes premium Arcane',
      title: 'Choisissez votre niveau',
      subtitle: 'Débloquez l’IA, l’automatisation et un accompagnement 24/7 pour vos opérations de scouting.',
    },
    sections: {
      benefitsTitle: 'Pourquoi Arcane ?',
      notesTitle: 'Notes tarifaires',
    },
    current: {
      label: 'Votre abonnement',
      tierFree: 'Plan Free',
      helper: 'Passez sur un plan premium pour activer ArkaneGPT, ArkaneIndex et les automatisations.',
      cancel: 'Annuler mon abonnement',
      reactivate: 'Réactiver mon abonnement',
      infoActive: 'Renouvellement prévu le {{date}}',
      infoCancelled: 'Accès premium jusqu’au {{date}}',
      infoFree: 'Vous utilisez la version gratuite Arcane.',
      currentBadge: 'Plan actuel',
      popularBadge: 'Populaire',
      moreFeatures: '+{{count}} fonctionnalités supplémentaires',
    },
    status: {
      ACTIVE: 'Actif',
      TRIAL: 'Essai',
      CANCELLED: 'Annulé',
      EXPIRED: 'Expiré',
      PAST_DUE: 'Paiement en retard',
    },
    billing: {
      monthly: 'Mensuel',
      yearly: 'Annuel (-17%)',
      monthlyHelper: 'Facturation flexible, résiliable à tout moment.',
      yearlyHelper: 'Facturation annuelle avec remise et support prioritaire.',
      monthlyShort: '/mois',
      yearlyShort: '/an',
    },
    warnings: {
      pricingFallback: 'Impossible de récupérer les tarifs en temps réel. Les prix affichés sont indicatifs.',
    },
    modals: {
      alreadyOnPlan: 'Vous êtes déjà sur le plan {{plan}}.',
      confirmTitle: 'Confirmer le changement',
      confirmDescription: 'Souhaitez-vous {{action}} ?',
      success: 'Votre abonnement a été mis à jour.',
      error: 'Impossible de mettre à jour votre abonnement pour le moment.',
      cancelTitle: 'Annuler mon abonnement',
      cancelMessage: 'Vous perdrez l’accès aux fonctionnalités premium à la fin de la période en cours. Continuer ?',
      cancelConfirm: 'Oui, annuler',
      cancelSuccess: 'Abonnement annulé',
      cancelSuccessMessage: 'Votre accès premium restera actif jusqu’à la date de fin.',
      cancelError: 'Impossible d’annuler l’abonnement. Réessayez plus tard.',
      reactivateSuccess: 'Réactivation en cours',
      reactivateSuccessMessage: 'Votre abonnement sera réactivé sous peu.',
      reactivateError: 'Impossible de réactiver pour le moment.',
    },
    notes: [
      'Tarification mise à jour après l’audit 2025 (+150% MRR).',
      'Toujours 10x moins cher qu’une licence Wyscout complète.',
      'Les plans annuels bénéficient d’une remise de 17%.',
      'Prix affichés hors TVA. Facturation en euros.',
    ],
    benefits: [
      {
        title: 'IA & Automations',
        description: 'ArkaneGPT, ArkaneIndex™, Voice-to-Report et matchmaking IA inclus dès Gold.',
      },
      {
        title: 'Fiabilité & Support',
        description: 'Account manager dédié, SLA 24/7 et onboarding personnalisé pour les équipes.',
      },
      {
        title: 'Pilotage business',
        description: 'Kanban multi-équipe, analytics avancés, webhooks et API pour vos outils internes.',
      },
    ],
    actions: {
      upgrade: 'passer au plan {{plan}} ({{price}})',
      downgrade: 'revenir sur {{plan}}',
      contact: 'contacter Arcane',
    },
    plans: {
      FREE: {
        name: 'Free',
        tagline: 'Découverte illimitée',
        description: 'Pour tester Arcane sans engagement.',
        priceMonthly: 0,
        priceYearly: 0,
        currency: 'EUR',
        features: [
          'Accès aux joueurs publics',
          'Profil joueur basique',
          'Recherche limitée (10/jour)',
          'Support communautaire',
        ],
        cta: 'Commencer',
      },
      BASIC: {
        name: 'Basic',
        tagline: 'Scouts indépendants',
        description: 'Passez à la vitesse supérieure avec les rapports Arcane.',
        priceMonthly: 19.99,
        priceYearly: 199.99,
        currency: 'EUR',
        features: [
          'Rapports illimités (10/mois garantis)',
          'Kanban personnel',
          'Export PDF',
          'Recherche avancée illimitée',
          'Support email (48h)',
        ],
        cta: 'Passer à Basic',
      },
      GOLD: {
        name: 'Gold',
        tagline: 'Équipes pro',
        description: 'Le meilleur de l’IA Arcane pour votre cellule de scouting.',
        priceMonthly: 49.99,
        priceYearly: 499.99,
        currency: 'EUR',
        features: [
          'ArkaneGPT & ArkaneIndex™',
          'Rapports et automations illimités',
          'Matchmaking IA clubs-joueurs',
          'Collaboration équipe (3 membres)',
          'API (10 000 appels/mois)',
          'Support prioritaire 24h',
        ],
        cta: 'Passer à Gold',
      },
      PRO: {
        name: 'Pro',
        tagline: 'Agences internationales',
        description: 'Infrastructure complète pour agences et clubs.',
        priceMonthly: 149,
        priceYearly: 1488,
        currency: 'EUR',
        features: [
          'Équipe illimitée & rôles avancés',
          'Analyse vidéo IA et détection automatique',
          'Webhooks & intégrations personnalisées',
          'Tableaux de bord analytics avancés',
          'Account manager dédié',
          'SLA 99.9% et support premium',
        ],
        cta: 'Passer à Pro',
      },
      ENTERPRISE: {
        name: 'Enterprise',
        tagline: 'Programmes sur-mesure',
        description: 'Solutions personnalisées pour fédérations, ligues et groupes.',
        priceMonthly: 999,
        priceYearly: 9999,
        currency: 'EUR',
        features: [
          'Infrastructure dédiée & SSO',
          'Conformité RGPD + audit annuel',
          'Formation sur site',
          'Développement de features custom',
          'API illimitée',
          'Support 24/7 avec SLA 99.95%',
        ],
        cta: 'Contacter Arcane',
      },
    },
  },
  aiTools: {
    index: {
      header: {
        title: 'ArkaneIndex',
      },
      hero: {
        title: 'Score IA des talents',
        subtitle:
          'Analyse en temps réel des joueurs avec les critères Arkane (technique, physique, mental, tactique, potentiel…).',
      },
      search: {
        title: 'Rechercher un joueur',
        placeholder: "Entrez l'ID du joueur",
        button: 'Analyser',
        errors: {
          generic: 'Impossible de récupérer l’index pour ce joueur.',
        },
      },
      scoreCard: {
        globalScore: 'Score global',
        lastUpdated: 'Dernière mise à jour',
        notAvailable: 'Non disponible',
        sourceLabel: 'Source',
        sourceFallback: 'ai-service',
      },
      breakdown: {
        title: 'Décomposition du scoring',
        empty: {
          title: 'Aucune donnée détaillée',
          description:
            'Configurez ArkaneIndex côté backend pour afficher les composantes techniques, physiques et tactiques d’un joueur.',
        },
        fallbackName: 'Dimension inconnue',
        fallbackDescription: 'Description non fournie par le moteur IA.',
      },
    },
  },
  autoScout: {
    hero: {
      title: 'AutoScout IA',
      subtitle: 'Génération automatique de rapports par intelligence artificielle',
      badge: 'Propulsé par GPT-4',
      note: 'Chaque rapport consomme des crédits IA. Prévisualisez et sauvegardez vos meilleurs livrables.',
    },
    tabs: {
      generate: 'Générer',
      history: 'Historique',
    },
    steps: {
      template: 'Modèle',
      configure: 'Paramétrer',
      generating: 'Génération',
      preview: 'Aperçu',
    },
    history: {
      title: 'Historique AutoScout',
      subtitle: 'Vos derniers rapports générés par l\'IA',
      loading: 'Chargement des rapports…',
      filters: {
        tabs: {
          all: 'Tous',
          saved: 'Enregistrés',
          draft: 'Brouillons',
        },
        grades: {
          all: 'Tous les grades',
          S: 'Grade S',
          A: 'Grade A',
          B: 'Grade B',
          C: 'Grade C',
          D: 'Grade D',
        },
        types: {
          all: 'Tous les modèles',
          MATCH_PERFORMANCE: 'Performance de match',
          SEASON_OVERVIEW: 'Bilan de saison',
          TRANSFER_TARGET: 'Cible mercato',
          YOUTH_PROSPECT: 'Espoir',
          QUICK_SCAN: 'Scan express',
        },
        reset: 'Réinitialiser les filtres',
      },
      badge: {
        official: 'Officiel',
      },
      actions: {
        view: 'Voir le rapport',
        export: 'Exporter',
        delete: 'Supprimer',
      },
      confirmations: {
        delete: 'Supprimer ce rapport ?',
      },
      toasts: {
        loadError: 'Impossible de charger l\'historique des rapports',
        deleteSuccess: 'Rapport supprimé avec succès',
        deleteError: 'Impossible de supprimer ce rapport',
        exportPlaceholder: 'L\'export sera bientôt disponible.',
      },
      statuses: {
        saved: 'Enregistré',
        draft: 'Brouillon',
      },
      alerts: {
        deleteTitle: 'Supprimer ce rapport ?',
        deleteMessage: 'Cette action est irréversible.',
        cancel: 'Annuler',
        confirm: 'Supprimer',
        successTitle: 'Succès',
        successMessage: 'Opération réussie',
        close: 'Fermer',
        errorTitle: 'Erreur',
        errorMessage: 'Une erreur est survenue',
        viewTitle: 'Aperçu du rapport',
        viewMessage: 'Affichage du rapport pour {{player}}',
        exportTitle: 'Export du rapport',
        exportMessage: 'L\'export sera disponible très bientôt.',
      },
      empty: {
        title: 'Aucun rapport enregistré',
        description: 'Générez un rapport AutoScout pour l\'afficher dans votre historique.',
        cta: 'Créer un rapport',
      },
      errors: {
        load: 'Impossible de charger l\'historique des rapports.',
        noPlayer: 'Aucun joueur disponible. Ajoutez un joueur pour afficher vos rapports.',
      },
    },
    wizard: {
      header: {
        title: 'AutoScout IA',
        stepLabel: 'Étape {{current}} sur {{total}}',
      },
      navigation: {
        continue: 'Continuer',
        generate: 'Générer le rapport',
      },
      template: {
        title: 'Sélectionner un template',
        subtitle: 'Choisissez le type d’analyse qui correspond à votre besoin',
        loading: 'Chargement des templates…',
      },
      config: {
        title: 'Configurer le rapport',
        subtitle: 'Sélectionnez un joueur et, si besoin, un match à analyser',
        playerLabel: 'Joueur *',
        playerPlaceholder: 'Sélectionnez un joueur',
        searchPlaceholder: 'Rechercher un joueur…',
        cancel: 'Annuler',
        matchLabel: 'Match (optionnel)',
        matchHint: 'Choisissez un match pour une analyse détaillée',
        matchPlaceholder: 'Sélectionnez un match (optionnel)',
        contextLabel: 'Contexte personnalisé (optionnel)',
        contextHint: 'Ajoutez des axes d’analyse ou un briefing précis',
        contextPlaceholder: 'Ex: concentrez-vous sur les qualités défensives et la projection au milieu.',
        autoSaveLabel: 'Enregistrer automatiquement',
        autoSaveHint: 'Sauvegarde le rapport dès la fin de la génération',
      },
      alerts: {
        cost: {
          title: 'Générer le rapport ?',
          message: 'Cela coûtera environ $0.02-0.03 via GPT-4.',
          cancel: 'Annuler',
          confirm: 'Générer',
        },
        rateLimit: {
          title: 'Limite atteinte',
          message: 'Nombre maximal de rapports par heure atteint. Réessayez plus tard.',
          confirm: 'OK',
        },
        failure: {
          title: 'Génération impossible',
          message: 'Impossible de générer le rapport. Veuillez réessayer.',
          cancel: 'Annuler',
          retry: 'Réessayer',
        },
        save: {
          successTitle: 'Succès',
          successMessage: 'Rapport enregistré avec succès.',
          errorTitle: 'Erreur',
          errorMessage: 'Impossible d’enregistrer le rapport. Réessayez plus tard.',
        },
        exitPreview: {
          title: 'Quitter l’aperçu ?',
          message: 'Revenir en arrière supprimera ce rapport généré.',
          cancel: 'Annuler',
          confirm: 'Revenir',
        },
      },
      progress: {
        title: 'Génération du rapport',
        initializing: 'Initialisation du pipeline…',
        timeEstimate: 'Temps restant estimé : {{seconds}} s',
        poweredBy: 'Propulsé par GPT-4',
        stages: {
          fetching: {
            label: 'Collecte des données',
            description: 'Récupération des statistiques et performances',
            message: 'Récupération des statistiques du joueur…',
          },
          generating: {
            label: 'Analyse IA',
            description: 'Arcane IA produit les insights et la narration',
            message: 'Analyse IA en cours…',
          },
          scoring: {
            label: 'Évaluation qualité',
            description: 'Contrôle de cohérence et scoring final',
            message: 'Évaluation finale de la qualité…',
          },
          complete: {
            label: 'Terminé',
            description: 'Rapport disponible',
            message: 'Rapport prêt !',
          },
        },
      },
      preview: {
        summary: 'Synthèse',
        sections: {
          technical: 'Compétences techniques',
          tactical: 'Sens tactique',
          physical: 'Profil physique',
          mental: 'Mental & leadership',
        },
        ratings: {
          overall: 'Note globale',
          potential: 'Potentiel',
        },
        recommendations: 'Recommandations',
        comparable: 'Joueurs comparables',
        metadata: {
          generated: 'Généré le {{date}}',
          model: 'Modèle : {{model}}',
        },
        actions: {
          discard: 'Supprimer',
          regenerate: 'Régénérer',
          save: 'Enregistrer',
        },
        alerts: {
          discard: {
            title: 'Supprimer ce rapport ?',
            message: 'Cette action est définitive.',
            cancel: 'Annuler',
            confirm: 'Supprimer',
          },
          regenerate: {
            title: 'Régénérer le rapport ?',
            message: 'Le rapport actuel sera remplacé par une nouvelle version.',
            cancel: 'Annuler',
            confirm: 'Régénérer',
          },
          lowQuality: {
            title: 'Qualité à vérifier',
            message: 'Ce rapport a une faible note. Voulez-vous l’enregistrer quand même ?',
            cancel: 'Annuler',
            confirm: 'Enregistrer quand même',
          },
        },
        sectionDetails: {
          strengths: 'Points forts',
          weaknesses: 'Points à améliorer',
          details: 'Détails',
        },
      },
      quality: {
        modalTitle: 'Détail du score de qualité',
        grades: {
          S: 'Exceptionnel',
          A: 'Excellent',
          B: 'Bon',
          C: 'Moyen',
          D: 'À améliorer',
        },
        breakdown: {
          dataCompleteness: {
            label: 'Complétude des données',
            description: 'Richesse et fiabilité des données sources',
          },
          insightDepth: {
            label: 'Profondeur des insights',
            description: 'Qualité et précision de l’analyse IA',
          },
          technicalAccuracy: {
            label: 'Précision technique',
            description: 'Exactitude des évaluations techniques',
          },
          actionability: {
            label: 'Actionnabilité',
            description: 'Utilité concrète des recommandations',
          },
        },
      },
      stats: {
        totalReports: 'Rapports générés',
        averageQualityScore: 'Qualité moyenne',
        estimatedCost: 'Coût estimé',
        templateUsage: 'Templates actifs',
      },
    },
    progress: {
      fetching: 'Récupération des statistiques joueur…',
      generating: 'Analyse des performances en cours…',
      scoring: 'Calcul du score de qualité…',
      complete: 'Rapport généré avec succès !',
      error: 'La génération a échoué, veuillez réessayer.',
    },
    navigation: {
      back: 'Retour',
      next: 'Suivant',
    },
    confirmations: {
      discard: 'Êtes-vous sûr de vouloir abandonner ce rapport ?',
    },
    toasts: {
      selectTemplateError: 'Merci de sélectionner un modèle avant de continuer.',
      generateSuccess: 'Rapport généré avec succès !',
      generateError: 'Impossible de générer le rapport.',
      saveSuccess: 'Rapport enregistré.',
      saveError: 'Erreur lors de la sauvegarde du rapport.',
      discardInfo: 'Rapport supprimé.',
    },
  },
  matches: {
    header: {
      title: 'Matchs',
    },
    search: {
      placeholder: 'Rechercher un match, un club...',
    },
    status: {
      scheduled: 'Programmé',
      live: 'EN DIRECT',
      halfTime: 'Mi-temps',
      completed: 'Terminé',
      postponed: 'Reporté',
      cancelled: 'Annulé',
    },
    filters: {
      all: 'Tous',
      scheduled: 'Programmés',
      live: 'En direct',
      completed: 'Terminés',
    },
    empty: {
      search: 'Aucun match trouvé pour cette recherche',
      default: 'Aucun match disponible',
    },
    competition: {
      friendly: 'Match amical',
    },
  },
  players: {
    header: {
      title: 'Joueurs',
    },
    layout: {
      title: 'Joueurs scoutés',
      subtitle: 'Gérez vos prospects et votre watchlist',
    },
    search: {
      placeholder: 'Rechercher des joueurs, clubs, positions...',
    },
    cards: {
      overall: 'Note globale',
      position: 'Poste',
      foot: 'Pied fort',
      league: 'Ligue',
      value: 'Valeur marchande',
      goals: 'Buts',
      assists: 'Passes D.',
    },
    stats: {
      totalLabel: 'Total joueurs',
      watchlistLabel: 'Dans la watchlist',
      delta: {
        month: 'ce mois',
        today: 'aujourd\'hui',
        stableMonth: 'Aucun changement ce mois',
        stableToday: 'Aucun changement aujourd\'hui',
      },
    },
    filters: {
      all: 'Tous',
      position: 'Poste',
      league: 'Ligue',
      trending: 'Tendance',
      contextAll: 'Toutes positions',
    },
    sections: {
      allPlayers: 'Tous les joueurs',
      sort: 'Trier',
    },
    empty: {
      title: 'Aucun joueur trouvé',
    },
  },
  ai: {
    header: {
      title: 'Assistant IA',
    },
    hero: {
      title: 'ARCANE AI',
      subtitle: 'Votre assistant intelligent de scouting football',
    },
    quickChat: {
      title: 'Discussion rapide',
      placeholder: 'Demandez-moi ce que vous voulez sur le scouting...',
      responseLabel: 'ArkaneGPT',
      fallbackResponse: 'Je n\'ai pas de réponse disponible pour le moment, réessaie avec plus de contexte.',
      errorMessage: 'Impossible de récupérer une réponse IA. Vérifie ta connexion ou réessaie plus tard.',
    },
    features: {
      title: 'Fonctionnalités IA',
      cards: {
        arkaneMatch: {
          title: 'ArkaneMatch AI',
          description: 'Trouvez des scouts avec l\'IA conversationnelle',
        },
        arkaneGPT: {
          title: 'ARCANE GPT',
          description: 'Discutez avec l\'IA pour des insights et analyses',
        },
        arkaneIndex: {
          title: 'ARCANE Index',
          description: 'Recherche avancée et recommandations de joueurs',
        },
        marketValue: {
          title: 'Market Value AI',
          description: 'Évaluation de marché des joueurs par IA',
        },
        smartScout: {
          title: 'SmartScout AI',
          description: 'Suggestions intelligentes et autocomplétion pour rapports',
        },
        autoScout: {
          title: 'AutoScout AI',
          description: 'Générez des rapports de scouting complets par IA',
        },
        comparison: {
          title: 'Comparaison de joueurs',
          description: 'Comparez les joueurs avec l\'IA',
        },
      },
    },
    conversations: {
      title: 'Conversations récentes',
      empty: {
        title: 'Aucune conversation récente',
        subtitle: 'Commencez à discuter avec ARCANE AI pour voir votre historique',
      },
    },
    usage: {
      title: 'Utilisation IA',
      stats: {
        queries: 'Requêtes',
        reportsAnalyzed: 'Rapports analysés',
      },
    },
  },
  home: {
    header: {
      login: 'Se connecter',
      userFallback: 'Utilisateur',
    },
    hero: {
      badge: 'REDÉFINIR LE FOOTBALL',
      title: 'RÉVOLUTIONNER',
      subtitle: 'FOOTBALL',
      tagline: 'À travers la',
      performance: 'performance',
      precision: 'précision',
      and: 'et l\'',
      ambition: 'ambition audacieuse',
      ctaAuth: 'Explorer les joueurs',
      ctaGuest: 'Commencez votre parcours',
    },
    stats: {
      elitePlayers: 'Joueurs d\'élite',
      topClubs: 'Meilleurs clubs',
      successRate: 'Taux de réussite',
    },
    services: {
      title: 'NOS SERVICES',
      subtitle: 'Solutions complètes pour le football moderne',
      playerManagement: {
        title: 'Gestion de joueurs',
        description: 'Développement de carrière de bout en bout avec des stratégies personnalisées',
      },
      performanceAnalytics: {
        title: 'Analytique de performance',
        description: 'Suivi et insights alimentés par l\'IA pour des performances optimales',
      },
      globalNetwork: {
        title: 'Réseau mondial',
        description: 'Connectez-vous avec des clubs et scouts d\'élite du monde entier',
      },
    },
    cta: {
      badge: 'REJOINDRE L\'ÉLITE',
      title: 'Prêt à vous élever?',
      description: 'Rejoignez le réseau élite de joueurs, scouts et clubs',
      button: 'Commencer maintenant',
    },
    footer: {
      copyright: '© 2025 Arcane Football GmbH. Tous droits réservés.',
    },
  },
  settings: {
    title: 'Paramètres',
    sections: {
      appearance: {
        title: 'Apparence',
        theme: {
          title: 'Thème',
          subtitle: 'Choisir le thème de l\'application',
          options: {
            light: 'Clair',
            dark: 'Sombre',
            system: 'Système',
          },
        },
      },
      language: {
        title: 'Langue',
        subtitle: 'Langue de l\'application',
        description: 'Choisir la langue de l\'interface',
        options: {
          fr: 'Français',
          en: 'English',
        },
      },
      notifications: {
        title: 'Notifications',
        push: {
          title: 'Notifications push',
          subtitle: 'Recevoir des alertes',
        },
        matchReminders: {
          title: 'Rappels de matchs',
          subtitle: 'Alertes avant les matchs',
        },
      },
      data: {
        title: 'Données',
        clearCache: {
          title: 'Vider le cache',
          subtitle: 'Libérer de l\'espace',
          alertTitle: 'Vider le cache',
          alertMessage: 'Cela supprimera toutes les données temporaires. Continuer ?',
          successTitle: 'Succès',
          successMessage: 'Le cache a été vidé avec succès',
          errorTitle: 'Erreur',
          errorMessage: 'Impossible de vider le cache',
        },
      },
      about: {
        title: 'À propos',
        version: {
          title: 'Version',
          value: '1.0.0',
        },
        terms: {
          title: 'Conditions d\'utilisation',
          subtitle: 'Lire les CGU',
        },
        privacy: {
          title: 'Politique de confidentialité',
          subtitle: 'Gestion de vos données',
        },
      },
    },
    profile: {
      defaultName: 'Utilisateur',
      defaultEmail: 'email@example.com',
      editProfile: 'Modifier le profil',
    },
    logout: {
      button: 'Déconnexion',
      alertTitle: 'Déconnexion',
      alertMessage: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      cancel: 'Annuler',
      confirm: 'Déconnexion',
    },
  },
  marketplace: {
    header: {
      title: 'Marketplace des Scouts',
      subtitle: 'Trouvez des scouts experts pour votre club',
    },
    search: {
      placeholder: 'Rechercher des scouts...',
    },
    filters: {
      leagues: 'Ligues : {{count}}',
      positions: 'Postes : {{count}}',
      maxBudget: 'Max €{{amount}}/h',
      minRating: '{{rating}}+ ★',
      verified: 'Vérifié',
    },
    favorites: {
      title: 'Scouts favoris',
      showAll: 'Tout afficher',
      onlyFavorites: 'Favoris uniquement',
    },
    defaults: {
      headline: 'Profil de scouting d\'élite',
      position: 'Tous postes',
      rate: 'Sur devis',
    },
    empty: {
      title: 'Aucun scout trouvé',
      description: 'Essayez d\'ajuster vos filtres ou critères de recherche',
    },
    errors: {
      loadListings: 'Impossible de charger les annonces de scouts. Réessayez.',
      toggleFavorite: 'Impossible de mettre à jour le favori. Réessayez.',
    },
  },
  voiceReport: {
    header: {
      title: 'Voix vers Rapport',
    },
    toasts: {
      recordingStarted: {
        title: 'Enregistrement démarré',
        message: 'Parlez pour créer votre rapport',
      },
      recordingComplete: {
        title: 'Enregistrement terminé',
        message: 'Appuyez sur "Traiter l\'enregistrement" pour générer le rapport',
      },
      maxDuration: {
        title: 'Durée maximale atteinte',
        message: 'Enregistrement arrêté à 5 minutes',
      },
      processingComplete: {
        title: 'Traitement terminé',
        message: 'Confiance : {{confidence}}%',
      },
      draftCreated: {
        title: 'Brouillon créé',
        message: 'Vérifiez et soumettez votre rapport',
      },
    },
    errors: {
      startRecording: 'Impossible de démarrer l\'enregistrement. Réessayez.',
      stopRecording: 'Impossible d\'arrêter l\'enregistrement. Réessayez.',
      noAudio: 'Aucun enregistrement audio trouvé',
      processingFailed: {
        title: 'Échec du traitement',
        message: 'Impossible de traiter l\'enregistrement vocal. Réessayez.',
      },
      noData: 'Aucune donnée pour générer le rapport',
    },
    instructions: {
      idle: 'Appuyez sur le microphone pour commencer l\'enregistrement',
      recording: 'En cours... Appuyez à nouveau pour arrêter',
      recorded: 'Enregistrement sauvegardé. Traitez pour générer le rapport',
      processing: 'Traitement de votre enregistrement vocal...',
    },
    actions: {
      process: 'Traiter l\'enregistrement',
      generate: 'Générer le rapport',
    },
    processing: {
      message: 'Transcription et analyse en cours...',
    },
    sections: {
      warnings: 'Avertissements',
      suggestions: 'Suggestions',
    },
  },
  gamification: {
    hub: {
      title: 'Hub Gamification',
      subtitle: 'Suivez votre progression et vos succès',
    },
    stats: {
      achievements: 'Succès',
      totalXP: 'XP Total',
      streak: 'Série',
      validations: 'Validations',
      daysUnit: 'jours',
    },
    dailyChallenge: {
      title: 'Défi du jour',
      empty: {
        emoji: '🛌',
        title: 'Pas de défi aujourd\'hui',
        subtitle: 'Revenez plus tard pour gagner des points bonus',
      },
    },
    quickActions: {
      title: 'Actions rapides',
      viewAchievements: 'Voir les succès',
      leaderboards: 'Classements',
      myBadges: 'Mes badges',
    },
    recentUnlocks: {
      title: 'Récemment débloqués',
      seeAll: 'Voir tout',
    },
  },
  coaching: {
    hub: {
      title: 'Trouvez votre Coach',
      subtitle: 'Accompagnement expert pour votre parcours football',
    },
    search: {
      placeholder: 'Rechercher des coachs...',
      sortOptions: {
        rating: 'Mieux notés',
        priceLow: 'Prix: croissant',
        priceHigh: 'Prix: décroissant',
        experience: 'Plus expérimentés',
      },
    },
    sections: {
      featured: 'Coachs en vedette',
      all: 'Tous les coachs',
      coachCount: 'coachs',
    },
    results: {
      loading: 'Chargement des coachs...',
      count: {
        singular: 'Affichage de {{count}} coach',
        plural: 'Affichage de {{count}} coachs',
      },
      filtersApplied: {
        singular: '{{count}} filtre appliqué',
        plural: '{{count}} filtres appliqués',
      },
      empty: {
        title: 'Aucun coach trouvé',
        description: 'Essayez d\'ajuster vos filtres ou votre recherche',
        reset: 'Réinitialiser les filtres',
      },
    },
    filters: {
      title: 'Filtres',
      reset: 'Réinitialiser',
      sections: {
        coachingType: 'Type de coaching',
        rating: 'Note minimale',
        price: 'Prix max par heure',
        city: 'Ville',
        languages: 'Langues',
        remote: 'Sessions à distance',
      },
      ratingSuffix: 'Étoiles',
      priceSteps: [50, 100, 150, 200],
      coachingTypes: [
        { value: 'Tactics', label: 'Tactique' },
        { value: 'Fitness', label: 'Fitness' },
        { value: 'Mental', label: 'Mental' },
        { value: 'Technical', label: 'Technique' },
        { value: 'Video Analysis', label: 'Analyse vidéo' },
        { value: 'Goalkeeper', label: 'Gardien' },
        { value: 'Nutrition', label: 'Nutrition' },
      ],
    },
    cta: {
      becomeCoach: 'Devenir Coach',
      title: 'Devenir coach',
      description: 'Partagez votre expertise et aidez les joueurs à atteindre leur potentiel',
      button: 'Postuler maintenant',
    },
    error: {
      message: 'Impossible de charger les coachs',
      retry: 'Réessayer',
    },
  },
};

export type FRTranslations = typeof fr;
