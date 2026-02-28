import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../../services/api";
import { useAuth } from "../../contexts/AuthContext";
import { useLocalization } from "../../contexts/LocalizationContext";
import { theme } from "../../design/theme";
import type {
  AgentRequestItem,
  AgentRequestCategory,
  AgentRequestCreatePayload,
  AgentRequestMarketProfileRule,
  AgentRequestStatus,
} from "../../types";
import { isCategoryARole, isCategoryBRole } from "../../lib/roles";

type AgentRequestFilters = {
  status: AgentRequestStatus | "ALL";
  category: AgentRequestCategory | "ALL";
};

type ScoutOption = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
};

const STATUS_ORDER: AgentRequestStatus[] = [
  "CREATED",
  "IN_PROGRESS",
  "SATISFIED",
  "CANCELLED",
];
const CATEGORY_OPTIONS: Array<AgentRequestCategory> = [
  "EQUIPMENT",
  "INJURY",
  "MEDICAL",
  "OTHER",
];

const canManageStatus = (role?: string | null) =>
  isCategoryARole(role as any) || isCategoryBRole(role as any);

const normalizeDate = (iso?: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString();
};

const toDisplayName = (
  entry?: { firstName?: string | null; lastName?: string | null } | null,
) => {
  const first = entry?.firstName?.trim() ?? "";
  const last = entry?.lastName?.trim() ?? "";
  return `${first} ${last}`.trim() || "Sans nom";
};

const csvToList = (input: string) =>
  input
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

const listToCsv = (values?: string[]) =>
  Array.isArray(values) ? values.join(", ") : "";

const statusLabel: Record<AgentRequestStatus, string> = {
  CREATED: "Créé",
  IN_PROGRESS: "En route",
  SATISFIED: "Satisfait",
  CANCELLED: "Annulé",
};

const categoryLabel: Record<AgentRequestCategory, string> = {
  EQUIPMENT: "Équipement",
  INJURY: "Blessure",
  MEDICAL: "Médical",
  OTHER: "Autre",
};

export default function AgentRequestsScreen() {
  const { t } = useLocalization();
  const { user, activeRole } = useAuth();
  const role = activeRole || user?.role;
  const isAdminRole = isCategoryARole(role as any);
  const isAgentRole = isCategoryBRole(role as any);
  const isScoutRole = String(role ?? "").toUpperCase() === "SCOUT";
  const canCreateRequest = !isScoutRole;
  const canAssignScout = isAgentRole || isAdminRole;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requests, setRequests] = useState<AgentRequestItem[]>([]);
  const [scouts, setScouts] = useState<ScoutOption[]>([]);
  const [marketRules, setMarketRules] = useState<
    AgentRequestMarketProfileRule[]
  >([]);
  const [draftRules, setDraftRules] = useState<AgentRequestMarketProfileRule[]>(
    [],
  );
  const [filters, setFilters] = useState<AgentRequestFilters>({
    status: "ALL",
    category: "ALL",
  });
  const [form, setForm] = useState({
    title: "",
    category: "OTHER" as AgentRequestCategory,
    details: "",
    playerId: "",
    assigneeId: "",
    equipment: "",
    medicalDetails: "",
    preferredFoot: "",
    dueAt: "",
    priority: "MEDIUM" as AgentRequestCreatePayload["priority"],
  });

  const loadRules = useCallback(async () => {
    try {
      const result = await api.getMarketProfileRules();
      setMarketRules(result.rules ?? []);
      setDraftRules(result.rules ?? []);
    } catch (err) {
      console.error("Impossible de charger les règles profil marché", err);
    }
  }, []);

  const loadRequests = useCallback(async () => {
    try {
      const params: Record<string, any> = {
        page: 1,
        limit: 30,
      };

      if (filters.status !== "ALL") {
        params.status = filters.status;
      }
      if (filters.category !== "ALL") {
        params.category = filters.category;
      }
      if (isAgentRole) {
        params.myOnly = true;
      } else if (isScoutRole) {
        params.creatorRole = "AGENT";
      }

      const result = await api.listAgentRequests(params);
      const incoming = Array.isArray(result.data) ? result.data : [];
      const filteredForScout = isScoutRole
        ? incoming.filter(
            (item) =>
              item.creatorRole === "AGENT" && item.assignee?.id === user?.id,
          )
        : incoming;
      setRequests(filteredForScout);
    } catch (error) {
      console.error("Impossible de charger les demandes à l'agent", error);
      Alert.alert("Erreur", "Impossible de charger les demandes à l'agent.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, isAgentRole, isScoutRole, user?.id]);

  const loadScouts = useCallback(async () => {
    if (!canAssignScout) {
      setScouts([]);
      return;
    }

    try {
      const payload = await api.getUsers({
        role: "SCOUT",
        page: 1,
        limit: 100,
      });
      const users = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      const normalized = users.map((entry: any) => ({
        id: String(entry.id),
        firstName: entry.firstName,
        lastName: entry.lastName,
      }));
      setScouts(normalized);
    } catch (error) {
      console.error(
        "Impossible de charger /users?role=SCOUT, fallback dashboard/scouts",
        error,
      );
      try {
        const payload = await api.getDashboardScouts({ page: 1, limit: 100 });
        const rows = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload?.items)
            ? payload.items
            : [];
        const normalized = rows.map((entry: any) => ({
          id: String(entry.id),
          firstName: entry.firstName,
          lastName: entry.lastName,
        }));
        setScouts(normalized);
      } catch (fallbackError) {
        console.error(
          "Impossible de charger la liste des scouts",
          fallbackError,
        );
        setScouts([]);
      }
    }
  }, [canAssignScout]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadRequests(), loadRules(), loadScouts()]);
  }, [loadRequests, loadRules, loadScouts]);

  useEffect(() => {
    void Promise.all([loadRequests(), loadRules(), loadScouts()]);
  }, [loadRequests, loadRules, loadScouts]);

  const handleSubmit = async () => {
    if (isScoutRole) {
      Alert.alert(
        "Mode lecture scout",
        "Ce profil affiche uniquement les demandes créées par des agents pour les scouts.",
      );
      return;
    }

    if (!form.title.trim()) {
      Alert.alert("Champ manquant", "Le titre est obligatoire");
      return;
    }

    if (isAgentRole && !form.assigneeId) {
      Alert.alert(
        "Scout requis",
        "Sélectionne le scout cible pour créer la demande.",
      );
      return;
    }

    const payload: AgentRequestCreatePayload = {
      title: form.title.trim(),
      category: form.category,
      priority: form.priority ?? "MEDIUM",
      details: form.details.trim() || undefined,
      playerId: form.playerId.trim() || undefined,
      assigneeId: form.assigneeId || undefined,
      dueAt: form.dueAt.trim() || undefined,
      preferredFoot:
        form.preferredFoot === "LEFT" ||
        form.preferredFoot === "RIGHT" ||
        form.preferredFoot === "BOTH"
          ? form.preferredFoot
          : undefined,
    };

    if (form.category === "EQUIPMENT" && form.equipment.trim()) {
      payload.equipment = form.equipment.trim();
    }
    if (form.category === "MEDICAL" && form.medicalDetails.trim()) {
      payload.medicalDetails = form.medicalDetails.trim();
    }

    try {
      setSaving(true);
      const created = await api.createAgentRequest(payload);
      setRequests((current) => [created, ...current]);
      setForm({
        title: "",
        category: "OTHER",
        details: "",
        playerId: "",
        assigneeId: "",
        equipment: "",
        medicalDetails: "",
        preferredFoot: "",
        dueAt: "",
        priority: "MEDIUM",
      });
      Alert.alert("OK", "Demande envoyée avec succès");
    } catch (error) {
      console.error("Impossible d’envoyer la demande", error);
      Alert.alert("Erreur", "Impossible d’envoyer la demande.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    status: AgentRequestStatus,
  ) => {
    try {
      const updated = await api.updateAgentRequestStatus(requestId, { status });
      setRequests((current) =>
        current.map((request) =>
          request.id === requestId ? updated : request,
        ),
      );
    } catch (error) {
      console.error("Impossible de mettre à jour le statut", error);
      Alert.alert(
        "Erreur",
        "Impossible de mettre à jour le statut de la demande.",
      );
    }
  };

  const handleRuleChange = (ruleId: string, isActive: boolean) => {
    setDraftRules((current) =>
      current.map((rule) =>
        rule.id === ruleId ? { ...rule, isActive } : rule,
      ),
    );
  };

  const handleRuleFieldChange = (
    ruleId: string,
    patch: Partial<AgentRequestMarketProfileRule>,
  ) => {
    setDraftRules((current) =>
      current.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule,
      ),
    );
  };

  const handleRuleSave = async () => {
    if (!isCategoryARole(role as any)) {
      Alert.alert(
        "Droits insuffisants",
        "Seuls les admins peuvent modifier les règles de marché.",
      );
      return;
    }

    try {
      setSaving(true);
      const updated = await api.updateMarketProfileRules(draftRules);
      setMarketRules(updated.rules ?? []);
      setDraftRules(updated.rules ?? []);
      Alert.alert("OK", "Règles mises à jour.");
    } catch (error) {
      console.error("Impossible de mettre à jour les règles marché", error);
      Alert.alert("Erreur", "Impossible de sauvegarder les règles.");
    } finally {
      setSaving(false);
    }
  };

  const pendingRequestsCount = useMemo(
    () =>
      requests.filter(
        (item) => item.status === "CREATED" || item.status === "IN_PROGRESS",
      ).length,
    [requests],
  );

  const visibleRules = useMemo(() => {
    if (isCategoryARole(role as any)) {
      return draftRules;
    }
    if (isCategoryBRole(role as any)) {
      return marketRules;
    }
    return marketRules.filter((rule) => rule.isActive);
  }, [draftRules, marketRules, role]);

  const renderRequest = ({ item }: { item: AgentRequestItem }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.statusChip}>
          {statusLabel[item.status] || item.status}
        </Text>
      </View>
      <Text style={styles.metaText}>
        {categoryLabel[item.category]} • Priorité {item.priority} • Créé le{" "}
        {normalizeDate(item.createdAt)}
      </Text>
      {!!item.dueAt && (
        <Text style={styles.metaText}>
          Échéance {normalizeDate(item.dueAt)}
        </Text>
      )}
      {!!item.details && <Text style={styles.bodyText}>{item.details}</Text>}
      {!!item.content?.equipment && (
        <Text style={styles.metaText}>
          Équipement: {item.content.equipment}
        </Text>
      )}
      {!!item.content?.medicalDetails && (
        <Text style={styles.metaText}>
          Médical: {item.content.medicalDetails}
        </Text>
      )}
      <Text style={styles.metaText}>
        Demandeur: {toDisplayName(item.creator)}
      </Text>
      {!!item.assignee && (
        <Text style={styles.metaText}>
          Scout ciblé: {toDisplayName(item.assignee)}
        </Text>
      )}

      {canManageStatus(role) ? (
        <View style={styles.statusActions}>
          {STATUS_ORDER.filter((status) => status !== item.status).map(
            (status) => (
              <TouchableOpacity
                key={`${item.id}-${status}`}
                style={styles.statusButton}
                onPress={() => handleStatusUpdate(item.id, status)}
                activeOpacity={0.85}
              >
                <Text style={styles.statusButtonText}>
                  → {statusLabel[status]}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>
      ) : null}
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <Text style={styles.sectionTitle}>{title}</Text>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={["top"]}>
        <ActivityIndicator size="large" color={theme.colors.brand.primary} />
        <Text style={styles.loadingText}>Chargement</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>
            {t("dashboard.cardMap.agentRequests") || "Demandes à l’agent"}
          </Text>
          <Text style={styles.subtitle}>
            {isAgentRole
              ? `${pendingRequestsCount} demande(s) créées vers scouts • suivi et traitement`
              : isScoutRole
                ? `${pendingRequestsCount} demande(s) agent pour scouts • lecture et suivi`
                : `${pendingRequestsCount} demande(s) en attente • créer, filtrer et suivre les besoins terrain`}
          </Text>
        </View>

        <View style={styles.filterRow}>
          {(["ALL", ...CATEGORY_OPTIONS] as const).map((category) => {
            const isActive = filters.category === category;
            return (
              <TouchableOpacity
                key={category}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() =>
                  setFilters((current) => ({
                    ...current,
                    category: category as any,
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {category === "ALL"
                    ? "Toutes"
                    : categoryLabel[category as AgentRequestCategory]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.filterRow}>
          {(["ALL", ...STATUS_ORDER] as const).map((status) => {
            const active = filters.status === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() =>
                  setFilters((current) => ({
                    ...current,
                    status: status as any,
                  }))
                }
              >
                <Text
                  style={[
                    styles.filterChipText,
                    active && styles.filterChipTextActive,
                  ]}
                >
                  {status === "ALL"
                    ? "Tous"
                    : statusLabel[status as AgentRequestStatus]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {canCreateRequest ? (
          <>
            <Text style={styles.sectionTitle}>Créer une demande</Text>
            <View style={styles.formCard}>
              <TextInput
                style={styles.input}
                placeholder="Titre"
                placeholderTextColor={theme.colors.text.secondary}
                value={form.title}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, title: value }))
                }
              />
              <Text style={styles.fieldLabel}>Catégorie</Text>
              <View style={styles.smallRow}>
                {CATEGORY_OPTIONS.map((category) => {
                  const active = form.category === category;
                  return (
                    <TouchableOpacity
                      key={category}
                      style={[
                        styles.filterChip,
                        active && styles.filterChipActive,
                      ]}
                      onPress={() =>
                        setForm((current) => ({ ...current, category }))
                      }
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          active && styles.filterChipTextActive,
                        ]}
                      >
                        {categoryLabel[category]}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Détails"
                placeholderTextColor={theme.colors.text.secondary}
                value={form.details}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, details: value }))
                }
                multiline
              />
              <TextInput
                style={styles.input}
                placeholder="Joueur lié (optionnel)"
                placeholderTextColor={theme.colors.text.secondary}
                value={form.playerId}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, playerId: value }))
                }
              />
              {canAssignScout ? (
                <>
                  <Text style={styles.fieldLabel}>
                    Scout cible {isAgentRole ? "(obligatoire)" : "(optionnel)"}
                  </Text>
                  <View style={styles.smallRow}>
                    {scouts.map((scout) => {
                      const active = form.assigneeId === scout.id;
                      return (
                        <TouchableOpacity
                          key={scout.id}
                          style={[
                            styles.scoutChip,
                            active && styles.scoutChipActive,
                          ]}
                          onPress={() =>
                            setForm((current) => ({
                              ...current,
                              assigneeId:
                                current.assigneeId === scout.id ? "" : scout.id,
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.scoutChipText,
                              active && styles.scoutChipTextActive,
                            ]}
                          >
                            {toDisplayName(scout)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                    {!scouts.length ? (
                      <Text style={styles.helperText}>
                        Aucun scout disponible pour le moment.
                      </Text>
                    ) : null}
                  </View>
                </>
              ) : null}
              <TextInput
                style={styles.input}
                placeholder="Échéance (YYYY-MM-DD, optionnel)"
                placeholderTextColor={theme.colors.text.secondary}
                value={form.dueAt}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, dueAt: value }))
                }
              />
              {form.category === "EQUIPMENT" ? (
                <TextInput
                  style={styles.input}
                  placeholder="Équipement"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={form.equipment}
                  onChangeText={(value) =>
                    setForm((current) => ({ ...current, equipment: value }))
                  }
                />
              ) : null}
              {form.category === "MEDICAL" ? (
                <TextInput
                  style={styles.input}
                  placeholder="Infos médicales"
                  placeholderTextColor={theme.colors.text.secondary}
                  value={form.medicalDetails}
                  onChangeText={(value) =>
                    setForm((current) => ({
                      ...current,
                      medicalDetails: value,
                    }))
                  }
                />
              ) : null}
              <TouchableOpacity
                style={styles.submit}
                onPress={handleSubmit}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? (
                  <ActivityIndicator color={theme.colors.text.primary} />
                ) : (
                  <Text style={styles.submitText}>Envoyer la demande</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : null}

        {renderSectionHeader(
          isAgentRole
            ? `Mes demandes agents vers scouts (${pendingRequestsCount} en cours)`
            : isScoutRole
              ? `Demandes des agents pour scouts (${pendingRequestsCount} en cours)`
              : `Demandes en cours (${pendingRequestsCount})`,
        )}
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          scrollEnabled={false}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              Aucune demande pour ce filtre.
            </Text>
          }
        />

        {renderSectionHeader("Règles marché/profil")}
        <View style={styles.formCard}>
          {visibleRules.map((rule) => (
            <View key={rule.id} style={styles.ruleRow}>
              <View style={styles.ruleContent}>
                <Text style={styles.ruleLabel}>{rule.label}</Text>
                <Text style={styles.ruleMeta}>
                  {rule.market}
                  {rule.positions?.length
                    ? ` • ${rule.positions.join(", ")}`
                    : ""}
                  {typeof rule.minHeightCm === "number"
                    ? ` • ${rule.minHeightCm} cm min`
                    : ""}
                  {typeof rule.minEndurance === "number"
                    ? ` • Endurance ${rule.minEndurance}`
                    : ""}
                  {rule.preferredFoot ? ` • Pied ${rule.preferredFoot}` : ""}
                  {rule.traits?.length
                    ? ` • Traits ${rule.traits.join(", ")}`
                    : ""}
                </Text>
                {isCategoryARole(role as any) ? (
                  <View style={styles.ruleEditor}>
                    <TextInput
                      style={styles.ruleInput}
                      placeholder="Positions (ex: ATTAQUANT, AILIER)"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={listToCsv(rule.positions)}
                      onChangeText={(value) =>
                        handleRuleFieldChange(rule.id, {
                          positions: csvToList(value),
                        })
                      }
                    />
                    <TextInput
                      style={styles.ruleInput}
                      placeholder="Traits (ex: Rapide, Endurant)"
                      placeholderTextColor={theme.colors.text.secondary}
                      value={listToCsv(rule.traits)}
                      onChangeText={(value) =>
                        handleRuleFieldChange(rule.id, {
                          traits: csvToList(value),
                        })
                      }
                    />
                    <View style={styles.ruleEditorRow}>
                      <TextInput
                        style={[styles.ruleInput, styles.ruleInputHalf]}
                        placeholder="Taille min (cm)"
                        placeholderTextColor={theme.colors.text.secondary}
                        keyboardType="numeric"
                        value={
                          typeof rule.minHeightCm === "number"
                            ? String(rule.minHeightCm)
                            : ""
                        }
                        onChangeText={(value) =>
                          handleRuleFieldChange(rule.id, {
                            minHeightCm: value.trim()
                              ? Number(value)
                              : undefined,
                          })
                        }
                      />
                      <TextInput
                        style={[styles.ruleInput, styles.ruleInputHalf]}
                        placeholder="Endurance min"
                        placeholderTextColor={theme.colors.text.secondary}
                        keyboardType="numeric"
                        value={
                          typeof rule.minEndurance === "number"
                            ? String(rule.minEndurance)
                            : ""
                        }
                        onChangeText={(value) =>
                          handleRuleFieldChange(rule.id, {
                            minEndurance: value.trim()
                              ? Number(value)
                              : undefined,
                          })
                        }
                      />
                    </View>
                    <View style={styles.ruleFootRow}>
                      {(["LEFT", "RIGHT", "BOTH"] as const).map((foot) => {
                        const active = rule.preferredFoot === foot;
                        return (
                          <TouchableOpacity
                            key={`${rule.id}-${foot}`}
                            style={[
                              styles.ruleFootChip,
                              active && styles.ruleFootChipActive,
                            ]}
                            onPress={() =>
                              handleRuleFieldChange(rule.id, {
                                preferredFoot:
                                  foot as AgentRequestMarketProfileRule["preferredFoot"],
                              })
                            }
                          >
                            <Text
                              style={[
                                styles.ruleFootChipText,
                                active && styles.ruleFootChipTextActive,
                              ]}
                            >
                              {foot}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                ) : null}
              </View>
              {isCategoryARole(role as any) ? (
                <Switch
                  value={!!rule.isActive}
                  onValueChange={(isActive) =>
                    handleRuleChange(rule.id, isActive)
                  }
                  trackColor={{
                    true: theme.colors.brand.primary,
                    false: theme.colors.semantic.muted,
                  }}
                  thumbColor={theme.colors.text.primary}
                />
              ) : (
                <Text style={styles.ruleReadOnlyChip}>
                  {rule.isActive ? "Actif" : "Inactif"}
                </Text>
              )}
            </View>
          ))}
          {isCategoryARole(role as any) ? (
            <TouchableOpacity
              style={styles.submit}
              onPress={handleRuleSave}
              activeOpacity={0.85}
            >
              {saving ? (
                <ActivityIndicator color={theme.colors.text.primary} />
              ) : (
                <Text style={styles.submitText}>Sauvegarder les règles</Text>
              )}
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.secondary,
  },
  scroll: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: theme.colors.background.secondary,
  },
  loadingText: {
    color: theme.colors.text.secondary,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: theme.colors.text.primary,
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.text.secondary,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  filterChipActive: {
    backgroundColor: theme.colors.brand.primary,
    borderColor: theme.colors.brand.primary,
  },
  filterChipText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: theme.colors.text.primary,
  },
  sectionTitle: {
    color: theme.colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  formCard: {
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.2)",
    padding: 12,
    marginBottom: 16,
  },
  fieldLabel: {
    color: theme.colors.text.secondary,
    marginBottom: 8,
    marginTop: 6,
  },
  smallRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    color: theme.colors.text.primary,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "rgba(2, 6, 23, 0.65)",
  },
  helperText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    marginBottom: 8,
  },
  scoutChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    backgroundColor: "rgba(2, 6, 23, 0.65)",
  },
  scoutChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}25`,
  },
  scoutChipText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: "600",
  },
  scoutChipTextActive: {
    color: theme.colors.brand.primary,
  },
  submit: {
    alignSelf: "flex-start",
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: theme.colors.brand.primary,
  },
  submitText: {
    color: theme.colors.text.primary,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
    padding: 12,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
    gap: 12,
  },
  cardTitle: {
    color: theme.colors.text.primary,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  statusChip: {
    backgroundColor: "rgba(245, 158, 11, 0.16)",
    color: "#fbbf24",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
    fontSize: 11,
    fontWeight: "700",
  },
  metaText: {
    color: theme.colors.text.secondary,
    marginTop: 4,
    fontSize: 12,
  },
  bodyText: {
    color: theme.colors.text.primary,
    marginTop: 6,
  },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: theme.colors.brand.primary,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  statusButtonText: {
    color: theme.colors.brand.primary,
    fontWeight: "600",
    fontSize: 12,
  },
  emptyState: {
    color: theme.colors.text.secondary,
    marginBottom: 12,
  },
  ruleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 12,
  },
  ruleContent: {
    flex: 1,
  },
  ruleLabel: {
    color: theme.colors.text.primary,
    marginBottom: 4,
    fontWeight: "700",
  },
  ruleMeta: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
  ruleEditor: {
    marginTop: 8,
  },
  ruleEditorRow: {
    flexDirection: "row",
    gap: 8,
  },
  ruleInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.25)",
    color: theme.colors.text.primary,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    backgroundColor: "rgba(2, 6, 23, 0.65)",
  },
  ruleInputHalf: {
    flex: 1,
  },
  ruleFootRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  ruleFootChip: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.3)",
    backgroundColor: "rgba(2, 6, 23, 0.65)",
  },
  ruleFootChipActive: {
    borderColor: theme.colors.brand.primary,
    backgroundColor: `${theme.colors.brand.primary}25`,
  },
  ruleFootChipText: {
    color: theme.colors.text.secondary,
    fontSize: 12,
    fontWeight: "700",
  },
  ruleFootChipTextActive: {
    color: theme.colors.brand.primary,
  },
  ruleReadOnlyChip: {
    color: theme.colors.text.secondary,
    fontSize: 12,
  },
});
