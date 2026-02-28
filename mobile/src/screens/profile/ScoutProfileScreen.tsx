import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing, typography } from '../../design/theme';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { marketplaceApi } from '../../services/marketplace.api';
import type { MarketplaceListing, MarketplaceOffer } from '../../types/marketplace';
import { playersApi } from '../../services/api/players';
import gamificationService from '../../services/api/gamification';
import { showError, showSuccess } from '../../services/toast';
import { isFeatureEnabled } from '../../constants/features';

type ScoutProfileForm = {
  headline: string;
  bio: string;
  leagues: string;
  positions: string;
  ageGroups: string;
  countries: string;
  travelRadius: string;
  languages: string;
  topReports: string;
  playersDiscovered: string;
  hourlyRate: string;
  matchRate: string;
  reportRate: string;
  currency: string;
};

const emptyForm: ScoutProfileForm = {
  headline: '',
  bio: '',
  leagues: '',
  positions: '',
  ageGroups: '',
  countries: '',
  travelRadius: '',
  languages: '',
  topReports: '',
  playersDiscovered: '',
  hourlyRate: '',
  matchRate: '',
  reportRate: '',
  currency: 'EUR',
};

const parseList = (value: string): string[] => {
  const seen = new Set<string>();
  const items = value
    .split(/[,;\n]+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const unique: string[] = [];
  items.forEach((item) => {
    const key = item.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(item);
    }
  });
  return unique;
};

const joinList = (value?: string[] | null) => (value && value.length > 0 ? value.join(', ') : '');

const parsePositiveNumber = (value: string): number | undefined => {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return undefined;
  return parsed;
};

const getStatusColor = (status?: string) => {
  if (status === 'ACTIVE') return colors.semantic.success;
  if (status === 'PAUSED') return colors.semantic.warning;
  if (status === 'ARCHIVED') return colors.semantic.error;
  return colors.text.secondary;
};

const getStatusLabel = (status?: string) => {
  if (status === 'ACTIVE') return 'Actif';
  if (status === 'PAUSED') return 'En pause';
  if (status === 'ARCHIVED') return 'Archivé';
  return 'Brouillon';
};

const buildFormFromListing = (listing: MarketplaceListing | null): ScoutProfileForm => {
  if (!listing) return emptyForm;
  const expertise = (listing.expertise ?? {}) as any;
  const availability = (listing.availability ?? {}) as any;
  const portfolio = (listing.portfolio ?? {}) as any;
  return {
    headline: listing.headline ?? '',
    bio: listing.bio ?? '',
    leagues: joinList(expertise.leagues),
    positions: joinList(expertise.positions),
    ageGroups: joinList(expertise.ageGroups),
    countries: joinList(availability.countries),
    travelRadius:
      typeof availability.travelRadius === 'number' ? String(availability.travelRadius) : '',
    languages: joinList(listing.languages),
    topReports: joinList(portfolio.topReports),
    playersDiscovered: joinList(portfolio.playersDiscovered),
    hourlyRate: listing.hourlyRate != null ? String(listing.hourlyRate) : '',
    matchRate: listing.matchRate != null ? String(listing.matchRate) : '',
    reportRate: listing.reportRate != null ? String(listing.reportRate) : '',
    currency: (listing.currency ?? 'EUR').toUpperCase(),
  };
};

const getInitials = (firstName?: string | null, lastName?: string | null): string => {
  const first = (firstName ?? '').trim().charAt(0).toUpperCase();
  const last = (lastName ?? '').trim().charAt(0).toUpperCase();
  const value = `${first}${last}`.trim();
  return value || 'SP';
};

const Field = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric';
}) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.text.secondary}
      style={[styles.input, multiline && styles.textArea]}
      multiline={multiline}
      numberOfLines={multiline ? 4 : 1}
      keyboardType={keyboardType ?? 'default'}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const BadgeList = ({ values }: { values: string[] }) => {
  if (!values.length) {
    return <Text style={styles.emptyValue}>Aucune donnée</Text>;
  }

  return (
    <View style={styles.badgeWrap}>
      {values.map((value) => (
        <View key={value} style={styles.badge}>
          <Text style={styles.badgeText}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

const Checklist = ({ values, emptyLabel }: { values: string[]; emptyLabel: string }) => {
  if (!values.length) {
    return <Text style={styles.emptyValue}>{emptyLabel}</Text>;
  }

  return (
    <View style={styles.checkList}>
      {values.map((value) => (
        <View key={value} style={styles.checkItemRow}>
          <View style={styles.checkItemBox}>
            <Ionicons name="checkmark" size={12} color="#2CFFD5" />
          </View>
          <Text style={styles.checkItemLabel}>{value}</Text>
        </View>
      ))}
    </View>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const SectionHeader = ({
  title,
  icon,
  showChevron = true,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  showChevron?: boolean;
}) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionHeaderLeft}>
      <View style={styles.sectionIconWrap}>
        <Ionicons name={icon} size={18} color="#D8F56D" />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    {showChevron ? <Ionicons name="chevron-forward" size={18} color="#B8BEDA" /> : null}
  </View>
);

const ScoutProfileScreen = ({ navigation }: any) => {
  const { user, activeRole } = useAuth();
  const role = activeRole ?? user?.role ?? 'PUBLIC';
  const canEditListing = role === 'SCOUT';
  const scoutProfileEnabled = isFeatureEnabled('scoutProfileScreen');

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [listing, setListing] = useState<MarketplaceListing | null>(null);
  const [form, setForm] = useState<ScoutProfileForm>(emptyForm);
  const [reportsSubmitted, setReportsSubmitted] = useState(0);
  const [usedByAgents, setUsedByAgents] = useState(0);
  const [playersDiscovered, setPlayersDiscovered] = useState(0);
  const [scoutLevel, setScoutLevel] = useState(0);

  const loadData = useCallback(
    async (silent = false) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const myListingPromise = marketplaceApi.getMyListing().catch((error: any) => {
          if ([403, 404].includes(error?.response?.status)) return null;
          throw error;
        });

        const [currentUser, reportsPayload, discoveredTreePayload, receivedOffersPayload, xp, myListing] =
          await Promise.all([
            api.getCurrentUser(),
            api.getScoutingReports().catch(() => []),
            playersApi.getDiscoveredTree({ squadType: 'ALL' }).catch(() => null),
            marketplaceApi.getReceivedOffers().catch(() => [] as MarketplaceOffer[]),
            gamificationService.getUserXP().catch(() => null),
            myListingPromise,
          ]);

        const reports = Array.isArray(reportsPayload)
          ? reportsPayload
          : reportsPayload?.items ?? reportsPayload?.data ?? [];
        const submittedStatuses = new Set(['SUBMITTED', 'APPROVED', 'REVIEWED']);
        const submittedCount = reports.filter((report: any) => submittedStatuses.has(report.status)).length;

        const listingStats = (myListing?.stats ?? {}) as any;
        const receivedOffers = Array.isArray(receivedOffersPayload) ? receivedOffersPayload : [];
        const usedByAgentsCount =
          typeof listingStats.completedOffers === 'number'
            ? listingStats.completedOffers
            : receivedOffers.filter((offer) => ['IN_PROGRESS', 'COMPLETED'].includes(offer.status)).length;

        const discoveredCount =
          discoveredTreePayload?.meta?.totalPlayers ??
          (Array.isArray(discoveredTreePayload?.data)
            ? discoveredTreePayload.data.reduce(
                (sum: number, country: any) => sum + (country.totalPlayers ?? 0),
                0,
              )
            : 0);

        setProfile(currentUser);
        setListing(myListing);
        setForm(buildFormFromListing(myListing));
        setReportsSubmitted(
          typeof listingStats.totalReports === 'number'
            ? Math.max(listingStats.totalReports, submittedCount)
            : submittedCount,
        );
        setUsedByAgents(usedByAgentsCount);
        setPlayersDiscovered(discoveredCount);
        setScoutLevel(xp?.level ?? 0);
      } catch (error) {
        showError('Impossible de charger le profil scout');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isCertified = scoutLevel >= 5;
  const listingStatus = listing?.status ?? 'DRAFT';
  const statusColor = getStatusColor(listingStatus);
  const listingExpertise = useMemo(() => (listing?.expertise ?? {}) as any, [listing]);
  const listingAvailability = useMemo(() => (listing?.availability ?? {}) as any, [listing]);
  const listingPortfolio = useMemo(() => (listing?.portfolio ?? {}) as any, [listing]);

  const displayName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim() || 'Scout';
  const displayEmail = profile?.email ?? 'Email non renseigné';
  const avatarInitials = getInitials(profile?.firstName, profile?.lastName);

  const travelRadiusValue =
    typeof listingAvailability.travelRadius === 'number' ? Math.max(0, listingAvailability.travelRadius) : 0;
  const travelRatio = Math.max(0, Math.min(1, travelRadiusValue / 500));

  const setFormValue = (key: keyof ScoutProfileForm, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const validateForm = useCallback((): string | null => {
    const headline = form.headline.trim();
    if (headline.length < 8) {
      return 'Le titre doit contenir au moins 8 caractères.';
    }

    const leagues = parseList(form.leagues);
    const countries = parseList(form.countries);
    if ((leagues.length > 0 && countries.length === 0) || (countries.length > 0 && leagues.length === 0)) {
      return 'Les ligues et pays de couverture doivent être renseignés ensemble.';
    }

    const travelRadius = parsePositiveNumber(form.travelRadius);
    if (form.travelRadius.trim() && travelRadius === undefined) {
      return 'Le rayon de déplacement doit être un nombre valide.';
    }
    if (travelRadius !== undefined && (travelRadius < 0 || travelRadius > 5000)) {
      return 'Le rayon de déplacement doit être compris entre 0 et 5000 km.';
    }

    const languages = parseList(form.languages);
    const hasInvalidLanguage = languages.some((lang) => !/^[a-z]{2}(-[a-z]{2})?$/i.test(lang.trim()));
    if (hasInvalidLanguage) {
      return 'Les langues doivent être au format ISO simple (ex: fr, en, es).';
    }

    const rates = [form.hourlyRate, form.matchRate, form.reportRate];
    const hasInvalidRate = rates.some((rate) => {
      if (!rate.trim()) return false;
      const parsed = Number(rate);
      return !Number.isFinite(parsed) || parsed < 0;
    });
    if (hasInvalidRate) {
      return 'Les tarifs doivent être des nombres positifs.';
    }

    return null;
  }, [form]);

  const buildPayload = useCallback(() => {
    const travelRadius = parsePositiveNumber(form.travelRadius);
    const hourlyRate = parsePositiveNumber(form.hourlyRate);
    const matchRate = parsePositiveNumber(form.matchRate);
    const reportRate = parsePositiveNumber(form.reportRate);

    return {
      headline: form.headline.trim(),
      bio: form.bio.trim() || undefined,
      expertise: {
        leagues: parseList(form.leagues),
        positions: parseList(form.positions),
        ageGroups: parseList(form.ageGroups),
      },
      languages: parseList(form.languages).map((item) => item.toLowerCase()),
      availability: {
        countries: parseList(form.countries),
        travelRadius,
      },
      hourlyRate,
      matchRate,
      reportRate,
      currency: form.currency.trim().toUpperCase() || 'EUR',
      portfolio: {
        topReports: parseList(form.topReports),
        playersDiscovered: parseList(form.playersDiscovered),
      },
    };
  }, [form]);

  const handleSave = useCallback(async () => {
    if (!canEditListing) {
      showError('Édition réservée au rôle scout');
      return;
    }

    const validationError = validateForm();
    if (validationError) {
      showError(validationError);
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload();
      const nextListing = listing
        ? await marketplaceApi.updateListing(payload)
        : await marketplaceApi.createListing(payload);
      setListing(nextListing);
      setEditing(false);
      showSuccess('Profil scout sauvegardé');
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Impossible de sauvegarder le profil scout');
    } finally {
      setSaving(false);
    }
  }, [buildPayload, canEditListing, listing, validateForm]);

  const handleToggleStatus = useCallback(async () => {
    if (!canEditListing) {
      showError('Action réservée au rôle scout');
      return;
    }
    if (!listing) {
      showError('Créez votre profil avant de changer le statut');
      return;
    }

    try {
      setStatusLoading(true);
      const nextListing =
        listing.status === 'ACTIVE'
          ? await marketplaceApi.pauseListing()
          : await marketplaceApi.activateListing();
      setListing(nextListing);
      showSuccess(nextListing.status === 'ACTIVE' ? 'Profil scout activé' : 'Profil scout mis en pause');
    } catch (error: any) {
      showError(error?.response?.data?.message ?? 'Impossible de changer le statut');
    } finally {
      setStatusLoading(false);
    }
  }, [canEditListing, listing]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#070B1A', '#050915', '#080C1E']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#D8F56D" />
        </View>
      </SafeAreaView>
    );
  }

  if (!scoutProfileEnabled) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#070B1A', '#050915', '#080C1E']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.disabledWrap}>
          <Text style={styles.disabledTitle}>Profil scout temporairement désactivé</Text>
          <Text style={styles.disabledText}>
            Activez EXPO_PUBLIC_SCOUT_PROFILE_SCREEN_ENABLED=true pour réafficher cet écran.
          </Text>
          <TouchableOpacity style={styles.primaryButtonSingle} onPress={() => navigation.goBack()}>
            <Text style={styles.primaryButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#070B1A', '#050915', '#080C1E']} style={StyleSheet.absoluteFillObject} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#D8F56D"
          />
        }
      >
        <LinearGradient
          colors={['#1B2158', '#10153D', '#0C1030']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTopRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
            <View style={styles.heroIdentityWrap}>
              <Text style={styles.heroName}>{displayName}</Text>
              <Text style={styles.heroMeta}>
                {role === 'SCOUT' ? 'Scout Pro' : role} • {displayEmail}
              </Text>
            </View>
            {canEditListing ? (
              <TouchableOpacity
                style={styles.heroEditBtn}
                onPress={() => {
                  if (editing) {
                    setEditing(false);
                    setForm(buildFormFromListing(listing));
                  } else {
                    setEditing(true);
                  }
                }}
              >
                <Ionicons name={editing ? 'close' : 'create-outline'} size={16} color="#E6EBFF" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.heroStatsRow}>
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue}>{reportsSubmitted}</Text>
              <Text style={styles.heroStatLabel}>rapports envoyés</Text>
            </View>
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue}>{usedByAgents}</Text>
              <Text style={styles.heroStatLabel}>utilisés par agents</Text>
            </View>
            <View style={styles.heroStatCell}>
              <Text style={styles.heroStatValue}>{playersDiscovered}</Text>
              <Text style={styles.heroStatLabel}>joueurs découverts</Text>
            </View>
          </View>

          <View style={styles.heroBottomRow}>
            <Text style={styles.heroBottomText}>Expérience & crédibilité</Text>
            <Ionicons name="chevron-forward" size={16} color="#B8BEDA" />
          </View>
        </LinearGradient>

        {!editing ? (
          <>
            <View style={styles.card}>
              <SectionHeader title="Rôle & statut" icon="briefcase-outline" />

              <View style={styles.grid}>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Type de scout</Text>
                  <Text style={styles.gridValue}>Scout terrain</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Niveau</Text>
                  <Text style={styles.gridValue}>{isCertified ? 'Confirmé' : 'Amateur'}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Rôle actif</Text>
                  <Text style={styles.gridValue}>{role}</Text>
                </View>
                <View style={styles.gridItem}>
                  <Text style={styles.gridLabel}>Statut du compte</Text>
                  <Text style={[styles.gridValue, { color: statusColor }]}>{getStatusLabel(listingStatus)}</Text>
                </View>
              </View>

              <View style={styles.sliderLabelRow}>
                <Text style={styles.inlineLabel}>Distance de mobilité</Text>
                <Text style={styles.sliderValue}>{travelRadiusValue} km</Text>
              </View>
              <View style={styles.sliderTrack}>
                <LinearGradient
                  colors={['#B7BD53', '#D8F56D', '#E3E8A1']}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={[styles.sliderFill, { width: `${travelRatio * 100}%` }]}
                />
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader title="Zones de couverture" icon="location-outline" />
              <Text style={styles.inlineLabel}>Countries</Text>
              <BadgeList values={listingAvailability.countries ?? []} />

              <Text style={styles.inlineLabel}>Ligues</Text>
              <BadgeList values={listingExpertise.leagues ?? []} />

              <Text style={styles.inlineLabel}>Catégories d'âge</Text>
              <BadgeList values={listingExpertise.ageGroups ?? []} />
            </View>

            <View style={styles.card}>
              <SectionHeader title="Spécialités de scouting" icon="search-outline" />

              <View style={styles.dualColumn}>
                <View style={styles.columnCard}>
                  <Text style={styles.columnTitle}>Postes préférés</Text>
                  <Checklist values={listingExpertise.positions ?? []} emptyLabel="Aucun poste renseigné" />
                </View>
                <View style={styles.columnCard}>
                  <Text style={styles.columnTitle}>Profils prioritaires</Text>
                  <Checklist values={listingExpertise.ageGroups ?? []} emptyLabel="Aucun profil prioritaire" />
                </View>
              </View>

              <Text style={styles.inlineLabel}>Langues</Text>
              <BadgeList values={listing?.languages ?? []} />

              <Text style={styles.inlineLabel}>Titre</Text>
              <Text style={styles.paragraph}>{listing?.headline ?? 'Aucun titre'}</Text>

              <Text style={styles.inlineLabel}>Bio</Text>
              <Text style={styles.paragraph}>{listing?.bio ?? 'Aucune bio'}</Text>
            </View>

            <View style={styles.card}>
              <SectionHeader title="Expérience & crédibilité" icon="star-outline" />
              <Text style={styles.inlineLabel}>Top rapports</Text>
              <BadgeList values={listingPortfolio.topReports ?? []} />

              <Text style={styles.inlineLabel}>Joueurs suivis</Text>
              <BadgeList values={listingPortfolio.playersDiscovered ?? []} />

              <InfoRow
                label="Tarif horaire"
                value={listing?.hourlyRate != null ? `${listing.hourlyRate} ${listing.currency ?? 'EUR'}` : '—'}
              />
              <InfoRow
                label="Tarif match"
                value={listing?.matchRate != null ? `${listing.matchRate} ${listing.currency ?? 'EUR'}` : '—'}
              />
              <InfoRow
                label="Tarif rapport"
                value={listing?.reportRate != null ? `${listing.reportRate} ${listing.currency ?? 'EUR'}` : '—'}
              />
            </View>
          </>
        ) : (
          <View style={styles.card}>
            <SectionHeader title="Édition profil scout" icon="create-outline" showChevron={false} />
            <Field
              label="Titre professionnel"
              value={form.headline}
              onChangeText={(value) => setFormValue('headline', value)}
              placeholder="Senior Scout - Ligue 1 & U19"
            />
            <Field
              label="Bio"
              value={form.bio}
              onChangeText={(value) => setFormValue('bio', value)}
              placeholder="Résumé expertise"
              multiline
            />
            <Field
              label="Ligues (virgules)"
              value={form.leagues}
              onChangeText={(value) => setFormValue('leagues', value)}
              placeholder="Ligue 1, Premier League"
            />
            <Field
              label="Postes (virgules)"
              value={form.positions}
              onChangeText={(value) => setFormValue('positions', value)}
              placeholder="GK, CB, ST"
            />
            <Field
              label="Catégories âge (virgules)"
              value={form.ageGroups}
              onChangeText={(value) => setFormValue('ageGroups', value)}
              placeholder="SENIOR, U19"
            />
            <Field
              label="Pays couverture (virgules)"
              value={form.countries}
              onChangeText={(value) => setFormValue('countries', value)}
              placeholder="France, Espagne"
            />
            <Field
              label="Rayon déplacement (km)"
              value={form.travelRadius}
              onChangeText={(value) => setFormValue('travelRadius', value)}
              placeholder="300"
              keyboardType="numeric"
            />
            <Field
              label="Langues (ISO, virgules)"
              value={form.languages}
              onChangeText={(value) => setFormValue('languages', value)}
              placeholder="fr, en, es"
            />
            <Field
              label="Portfolio top rapports"
              value={form.topReports}
              onChangeText={(value) => setFormValue('topReports', value)}
              placeholder="Report PSG-OM, Derby U19"
            />
            <Field
              label="Portfolio joueurs suivis"
              value={form.playersDiscovered}
              onChangeText={(value) => setFormValue('playersDiscovered', value)}
              placeholder="Joueur A, Joueur B"
            />
            <Field
              label="Tarif horaire"
              value={form.hourlyRate}
              onChangeText={(value) => setFormValue('hourlyRate', value)}
              placeholder="65"
              keyboardType="numeric"
            />
            <Field
              label="Tarif match"
              value={form.matchRate}
              onChangeText={(value) => setFormValue('matchRate', value)}
              placeholder="240"
              keyboardType="numeric"
            />
            <Field
              label="Tarif rapport"
              value={form.reportRate}
              onChangeText={(value) => setFormValue('reportRate', value)}
              placeholder="95"
              keyboardType="numeric"
            />
            <Field
              label="Devise"
              value={form.currency}
              onChangeText={(value) => setFormValue('currency', value.toUpperCase())}
              placeholder="EUR"
            />
          </View>
        )}

        {canEditListing ? (
          <View style={styles.actionsRow}>
            {editing ? (
              <>
                <TouchableOpacity
                  style={[styles.secondaryButton, saving && styles.buttonDisabled]}
                  onPress={() => {
                    setEditing(false);
                    setForm(buildFormFromListing(listing));
                  }}
                  disabled={saving}
                >
                  <Text style={styles.secondaryButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, saving && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color={colors.background.primary} />
                  ) : (
                    <Text style={styles.primaryButtonText}>Enregistrer</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    setForm(buildFormFromListing(listing));
                    setEditing(true);
                  }}
                >
                  <Text style={styles.secondaryButtonText}>{listing ? 'Modifier profil' : 'Créer profil'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.primaryButton, statusLoading && styles.buttonDisabled]}
                  onPress={handleToggleStatus}
                  disabled={statusLoading}
                >
                  {statusLoading ? (
                    <ActivityIndicator size="small" color={colors.background.primary} />
                  ) : (
                    <Text style={styles.primaryButtonText}>
                      {listingStatus === 'ACTIVE' ? 'Mettre en pause' : 'Activer profil'}
                    </Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        ) : (
          <View style={styles.readonlyNote}>
            <Text style={styles.readonlyNoteText}>
              Édition disponible uniquement pour les comptes avec rôle actif SCOUT.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#060A16',
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing['2xl'],
    gap: spacing.md,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  disabledTitle: {
    fontSize: typography.sizes.lg,
    color: '#F3F6FF',
    fontFamily: typography.fonts.bold,
    textAlign: 'center',
  },
  disabledText: {
    fontSize: typography.sizes.sm,
    color: '#A5ACCB',
    textAlign: 'center',
    lineHeight: 20,
  },
  heroCard: {
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: spacing.md,
    overflow: 'hidden',
    shadowColor: '#070C2A',
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D8F56D',
  },
  avatarText: {
    color: '#11152E',
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.bold,
  },
  heroIdentityWrap: {
    flex: 1,
  },
  heroName: {
    color: '#F4F7FF',
    fontSize: 28,
    fontFamily: typography.fonts.bold,
  },
  heroMeta: {
    marginTop: 2,
    color: '#B8BEDA',
    fontSize: typography.sizes.sm,
  },
  heroEditBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(14, 19, 53, 0.7)',
  },
  heroStatsRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
  },
  heroStatCell: {
    flex: 1,
    paddingHorizontal: 4,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.08)',
  },
  heroStatValue: {
    color: '#D8F56D',
    fontSize: 30,
    lineHeight: 34,
    fontFamily: typography.fonts.bold,
  },
  heroStatLabel: {
    color: '#E5E9FA',
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
  heroBottomRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBottomText: {
    color: '#C8CEE8',
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
  },
  card: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(15, 21, 55, 0.82)',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(216,245,109,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(216,245,109,0.25)',
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    color: '#F0F4FF',
    fontFamily: typography.fonts.bold,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridItem: {
    width: '48%',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(8, 13, 40, 0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 4,
  },
  gridLabel: {
    color: '#8E95B8',
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  gridValue: {
    color: '#EFF2FF',
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
  },
  sliderLabelRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sliderTrack: {
    marginTop: spacing.xs,
    width: '100%',
    height: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  sliderFill: {
    height: '100%',
    borderRadius: 999,
  },
  sliderValue: {
    color: '#E8ECB9',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
  },
  dualColumn: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  columnCard: {
    flex: 1,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(8, 13, 40, 0.72)',
    padding: spacing.sm,
    gap: spacing.xs,
  },
  columnTitle: {
    color: '#C5CCEA',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.medium,
  },
  checkList: {
    gap: 8,
  },
  checkItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkItemBox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(44,255,213,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(44,255,213,0.08)',
  },
  checkItemLabel: {
    color: '#F2F5FF',
    fontSize: typography.sizes.base,
    fontFamily: typography.fonts.medium,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.09)',
  },
  infoLabel: {
    fontSize: typography.sizes.sm,
    color: '#AEB5D1',
  },
  infoValue: {
    fontSize: typography.sizes.sm,
    color: '#F2F5FF',
    fontFamily: typography.fonts.medium,
    maxWidth: '60%',
    textAlign: 'right',
  },
  inlineLabel: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.xs,
    color: '#8F97BB',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraph: {
    marginTop: 4,
    color: '#EDF1FF',
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  emptyValue: {
    marginTop: spacing.xs,
    fontSize: typography.sizes.sm,
    color: '#8F97BB',
  },
  badgeWrap: {
    marginTop: spacing.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  badgeText: {
    fontSize: typography.sizes.xs,
    color: '#EEF1FF',
    fontFamily: typography.fonts.medium,
  },
  fieldWrap: {
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    marginBottom: 6,
    color: '#97A0C4',
    fontSize: typography.sizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(8, 13, 40, 0.75)',
    color: '#F4F7FF',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: typography.sizes.sm,
  },
  textArea: {
    minHeight: 90,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    borderRadius: radius.full,
    backgroundColor: '#D8F56D',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonSingle: {
    marginTop: spacing.md,
    borderRadius: radius.full,
    backgroundColor: '#D8F56D',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#0F1431',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#E9EEFF',
    fontSize: typography.sizes.sm,
    fontFamily: typography.fonts.bold,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  readonlyNote: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  readonlyNoteText: {
    fontSize: typography.sizes.sm,
    color: '#9AA3C8',
  },
});

export default ScoutProfileScreen;
