import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { showSuccess, showError } from '../services/toast';

export interface ScoutingReport {
  id: string;
  playerId: string;
  playerName: string;
  playerPosition: string;
  createdAt: Date;
  updatedAt: Date;
  scoutName: string;
  matchDate: string;
  opponent: string;
  competition: string;

  // Performance ratings (1-10)
  technicalSkills: number;
  tacticalAwareness: number;
  physicalCondition: number;
  mentalStrength: number;
  overallRating: number;

  // Detailed observations
  strengths: string[];
  weaknesses: string[];
  keyMoments: string[];

  // Specific skills
  skills: {
    pace: number;
    shooting: number;
    passing: number;
    dribbling: number;
    defending: number;
    heading: number;
  };

  // Recommendation
  recommendation: 'sign' | 'monitor' | 'pass';
  recommendationNotes: string;
  marketValueEstimate: number;

  // Match statistics
  matchStats?: {
    goals: number;
    assists: number;
    shots: number;
    passAccuracy: number;
    duelsWon: number;
    distance: number;
  };

  // Media
  videoUrls?: string[];
  imageUrls?: string[];

  // Status
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  tags: string[];
}

interface ScoutingContextType {
  reports: ScoutingReport[];
  loadReports: () => Promise<void>;
  getReport: (id: string) => ScoutingReport | undefined;
  getPlayerReports: (playerId: string) => ScoutingReport[];
  createReport: (report: Omit<ScoutingReport, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ScoutingReport>;
  updateReport: (id: string, updates: Partial<ScoutingReport>) => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  submitReport: (id: string) => Promise<void>;
  searchReports: (query: string) => ScoutingReport[];
  getRecentReports: (limit?: number) => ScoutingReport[];
  getDraftReports: () => ScoutingReport[];
  getReportsByStatus: (status: ScoutingReport['status']) => ScoutingReport[];
  exportReport: (id: string) => Promise<string>;
}

const ScoutingContext = createContext<ScoutingContextType | undefined>(undefined);

const STORAGE_KEY = '@arcane_scouting_reports';

export const ScoutingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [reports, setReports] = useState<ScoutingReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load reports from storage
  const loadReports = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedReports = JSON.parse(stored);
        // Convert date strings back to Date objects
        const reportsWithDates = parsedReports.map((r: any) => ({
          ...r,
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
        setReports(reportsWithDates);
      }
    } catch (error) {
      console.error('Error loading scouting reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Save reports to storage
  const saveReports = async (updatedReports: ScoutingReport[]) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedReports));
      setReports(updatedReports);
    } catch (error) {
      console.error('Error saving scouting reports:', error);
      showError('Erreur lors de la sauvegarde');
    }
  };

  // Load reports on mount
  useEffect(() => {
    loadReports();
  }, []);

  // Get a specific report
  const getReport = (id: string): ScoutingReport | undefined => {
    return reports.find(r => r.id === id);
  };

  // Get all reports for a player
  const getPlayerReports = (playerId: string): ScoutingReport[] => {
    return reports.filter(r => r.playerId === playerId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  // Create a new report
  const createReport = async (
    reportData: Omit<ScoutingReport, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ScoutingReport> => {
    const newReport: ScoutingReport = {
      ...reportData,
      id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedReports = [...reports, newReport];
    await saveReports(updatedReports);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Rapport créé avec succès');

    return newReport;
  };

  // Update a report
  const updateReport = async (id: string, updates: Partial<ScoutingReport>) => {
    const updatedReports = reports.map(r =>
      r.id === id
        ? { ...r, ...updates, updatedAt: new Date() }
        : r
    );

    await saveReports(updatedReports);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showSuccess('Rapport mis à jour');
  };

  // Delete a report
  const deleteReport = async (id: string) => {
    const updatedReports = reports.filter(r => r.id !== id);
    await saveReports(updatedReports);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showSuccess('Rapport supprimé');
  };

  // Submit a report for review
  const submitReport = async (id: string) => {
    await updateReport(id, { status: 'submitted' });
    showSuccess('Rapport soumis pour révision');
  };

  // Search reports
  const searchReports = (query: string): ScoutingReport[] => {
    const lowerQuery = query.toLowerCase();
    return reports.filter(r =>
      r.playerName.toLowerCase().includes(lowerQuery) ||
      r.opponent.toLowerCase().includes(lowerQuery) ||
      r.competition.toLowerCase().includes(lowerQuery) ||
      r.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  };

  // Get recent reports
  const getRecentReports = (limit: number = 10): ScoutingReport[] => {
    return [...reports]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  };

  // Get draft reports
  const getDraftReports = (): ScoutingReport[] => {
    return reports.filter(r => r.status === 'draft')
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  };

  // Get reports by status
  const getReportsByStatus = (status: ScoutingReport['status']): ScoutingReport[] => {
    return reports.filter(r => r.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  };

  // Export report as formatted text
  const exportReport = async (id: string): Promise<string> => {
    const report = getReport(id);
    if (!report) {
      throw new Error('Rapport non trouvé');
    }

    const exportText = `
RAPPORT DE SCOUTING
==================

Joueur: ${report.playerName} (${report.playerPosition})
Date du match: ${report.matchDate}
Adversaire: ${report.opponent}
Compétition: ${report.competition}
Scout: ${report.scoutName}

ÉVALUATION GÉNÉRALE
-------------------
Note globale: ${report.overallRating}/10
Compétences techniques: ${report.technicalSkills}/10
Conscience tactique: ${report.tacticalAwareness}/10
Condition physique: ${report.physicalCondition}/10
Force mentale: ${report.mentalStrength}/10

COMPÉTENCES DÉTAILLÉES
---------------------
Vitesse: ${report.skills.pace}/10
Tir: ${report.skills.shooting}/10
Passe: ${report.skills.passing}/10
Dribble: ${report.skills.dribbling}/10
Défense: ${report.skills.defending}/10
Jeu de tête: ${report.skills.heading}/10

POINTS FORTS
------------
${report.strengths.map(s => `• ${s}`).join('\n')}

POINTS FAIBLES
--------------
${report.weaknesses.map(w => `• ${w}`).join('\n')}

MOMENTS CLÉS
------------
${report.keyMoments.map(m => `• ${m}`).join('\n')}

RECOMMANDATION
--------------
Décision: ${report.recommendation === 'sign' ? 'RECRUTER' : report.recommendation === 'monitor' ? 'SURVEILLER' : 'PASSER'}
Valeur estimée: €${(report.marketValueEstimate / 1000000).toFixed(1)}M
Notes: ${report.recommendationNotes}

${report.matchStats ? `
STATISTIQUES DU MATCH
--------------------
Buts: ${report.matchStats.goals}
Passes décisives: ${report.matchStats.assists}
Tirs: ${report.matchStats.shots}
Précision des passes: ${report.matchStats.passAccuracy}%
Duels gagnés: ${report.matchStats.duelsWon}
Distance parcourue: ${report.matchStats.distance}km
` : ''}

Créé le: ${report.createdAt.toLocaleDateString('fr-FR')}
Dernière mise à jour: ${report.updatedAt.toLocaleDateString('fr-FR')}
Statut: ${report.status}
Tags: ${report.tags.join(', ')}
    `.trim();

    return exportText;
  };

  return (
    <ScoutingContext.Provider
      value={{
        reports,
        loadReports,
        getReport,
        getPlayerReports,
        createReport,
        updateReport,
        deleteReport,
        submitReport,
        searchReports,
        getRecentReports,
        getDraftReports,
        getReportsByStatus,
        exportReport,
      }}
    >
      {children}
    </ScoutingContext.Provider>
  );
};

export const useScouting = (): ScoutingContextType => {
  const context = useContext(ScoutingContext);
  if (!context) {
    throw new Error('useScouting must be used within ScoutingProvider');
  }
  return context;
};