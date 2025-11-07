"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { UpgradeModal } from '@/components/UpgradeModal';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { Sparkles, TrendingUp, Zap, Lock } from 'lucide-react';

/**
 * Example 1: Using useSubscriptionGuard hook with manual check
 */
export function ManualCheckExample() {
  const { checkAccess, requireAccess } = useSubscriptionGuard();
  const hasGoldAccess = checkAccess('GOLD');

  const handleFeatureClick = () => {
    if (!requireAccess('GOLD', 'AutoScout - Génération automatique')) {
      // Access denied - modal will be shown automatically
      return;
    }

    // User has access - proceed with feature
    toast.success('Accès autorisé! Génération en cours...');
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-black text-white mb-4">Manual Access Check</h3>

      <div className="space-y-4">
        {!hasGoldAccess && (
          <div className="bg-arcane-accent/10 border border-arcane-accent/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Lock className="h-5 w-5 text-arcane-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Fonctionnalité Premium</p>
                <p className="text-xs text-arcane-grey">
                  Cette fonctionnalité nécessite un abonnement GOLD
                </p>
              </div>
            </div>
          </div>
        )}

        <Button
          onClick={handleFeatureClick}
          className={hasGoldAccess ? 'bg-arcane-accent text-arcane-dark' : 'bg-arcane-darkBorder'}
          disabled={!hasGoldAccess}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Générer un rapport AutoScout
        </Button>
      </div>
    </GlassCard>
  );
}

/**
 * Example 2: Protecting an API call
 */
export function ProtectedApiCallExample() {
  const [loading, setLoading] = useState(false);
  const { requireAccess } = useSubscriptionGuard();

  const handleGenerateReport = async () => {
    // Check access before making API call
    if (!requireAccess('GOLD', 'SmartScout - Suggestions IA')) {
      return;
    }

    try {
      setLoading(true);

      // Make API call - if 403, modal will show automatically
      const result = await apiClient.getSmartScoutSuggestions(
        { summary: 'Test summary' },
        { playerId: 'test-id' }
      );

      toast.success('Suggestions générées avec succès!');
    } catch (error: any) {
      // 403 errors are handled by interceptor
      // Other errors should be shown
      if (error.message && !error.message.includes('403')) {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-6">
      <h3 className="text-xl font-black text-white mb-4">Protected API Call</h3>

      <Button
        onClick={handleGenerateReport}
        disabled={loading}
        className="bg-arcane-accent text-arcane-dark"
      >
        {loading ? 'Génération...' : 'Obtenir des suggestions IA'}
      </Button>
    </GlassCard>
  );
}

/**
 * Example 3: Conditional rendering based on tier
 */
export function ConditionalRenderingExample() {
  const { checkAccess } = useSubscriptionGuard();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Free Feature */}
      <GlassCard className="p-6">
        <Zap className="h-8 w-8 text-blue-400 mb-3" />
        <h4 className="text-lg font-black text-white mb-2">Statistiques Basiques</h4>
        <p className="text-sm text-arcane-grey mb-4">Disponible pour tous</p>
        <Button className="w-full bg-arcane-darkBorder">Voir les stats</Button>
      </GlassCard>

      {/* Gold Feature */}
      <GlassCard className={`p-6 ${!checkAccess('GOLD') ? 'opacity-60' : ''}`}>
        <div className="relative">
          {!checkAccess('GOLD') && (
            <Lock className="absolute -top-2 -right-2 h-6 w-6 text-arcane-accent" />
          )}
          <Sparkles className="h-8 w-8 text-arcane-accent mb-3" />
          <h4 className="text-lg font-black text-white mb-2">Analyses IA Avancées</h4>
          <p className="text-sm text-arcane-grey mb-4">
            {checkAccess('GOLD') ? 'Disponible pour vous' : 'Nécessite GOLD'}
          </p>
          <Button
            className="w-full bg-arcane-accent text-arcane-dark"
            disabled={!checkAccess('GOLD')}
          >
            {checkAccess('GOLD') ? 'Analyser' : 'Passer à GOLD'}
          </Button>
        </div>
      </GlassCard>

      {/* Pro Feature */}
      <GlassCard className={`p-6 ${!checkAccess('PRO') ? 'opacity-60' : ''}`}>
        <div className="relative">
          {!checkAccess('PRO') && (
            <Lock className="absolute -top-2 -right-2 h-6 w-6 text-purple-400" />
          )}
          <TrendingUp className="h-8 w-8 text-purple-400 mb-3" />
          <h4 className="text-lg font-black text-white mb-2">API Access</h4>
          <p className="text-sm text-arcane-grey mb-4">
            {checkAccess('PRO') ? 'Disponible pour vous' : 'Nécessite PRO'}
          </p>
          <Button
            className="w-full bg-purple-500/20 text-purple-400"
            disabled={!checkAccess('PRO')}
          >
            {checkAccess('PRO') ? 'Voir API Keys' : 'Passer à PRO'}
          </Button>
        </div>
      </GlassCard>
    </div>
  );
}

/**
 * Example 4: Standalone modal trigger
 */
export function StandaloneModalExample() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <GlassCard className="p-6">
        <h3 className="text-xl font-black text-white mb-4">Manual Modal Trigger</h3>

        <Button onClick={() => setModalOpen(true)} className="bg-arcane-accent text-arcane-dark">
          Afficher le modal d'upgrade
        </Button>
      </GlassCard>

      <UpgradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        blockedFeature="Fonctionnalité de test"
        requiredTier="GOLD"
      />
    </>
  );
}

/**
 * Full example page with all patterns
 */
export function UpgradeModalExamplesPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-black text-white mb-4">Upgrade Modal Examples</h1>
        <p className="text-arcane-grey">
          Different patterns for using the subscription guard system
        </p>
      </div>

      <ManualCheckExample />
      <ProtectedApiCallExample />
      <ConditionalRenderingExample />
      <StandaloneModalExample />
    </div>
  );
}
