"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";
import { CreateOfferPayload, OfferType } from "@/types/marketplace";

interface SendOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  scoutId: string;
  scoutName: string;
}

interface OfferFormState {
  offerType: OfferType;
  title: string;
  description: string;
  budget: string;
  currency: string;
  startDate: string;
  endDate: string;
  location: string;
}

const offerTypeOptions: Array<{ value: OfferType; label: string }> = [
  { value: "MATCH_ASSIGNMENT", label: "Match assignment" },
  { value: "PLAYER_REPORT", label: "Player report" },
  { value: "CONSULTATION", label: "Consultation" },
  { value: "RETAINER", label: "Retainer" },
];

const buildDefaultForm = (scoutName: string): OfferFormState => ({
  offerType: "MATCH_ASSIGNMENT",
  title: scoutName ? `Match assignment with ${scoutName}` : "",
  description: "",
  budget: "",
  currency: "EUR",
  startDate: "",
  endDate: "",
  location: "",
});

const inputClassName =
  "w-full px-4 py-3 rounded-lg bg-arcane-darkBorder/50 border border-arcane-darkBorder text-white placeholder-arcane-grey focus:border-arcane-accent focus:outline-none focus:ring-2 focus:ring-arcane-accent/20 transition-all";
const labelClassName = "block text-sm font-bold text-white mb-2 uppercase tracking-wider";

export function SendOfferModal({ isOpen, onClose, scoutId, scoutName }: SendOfferModalProps) {
  const [formData, setFormData] = useState<OfferFormState>(() => buildDefaultForm(scoutName));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(buildDefaultForm(scoutName));
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, scoutName]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    const budgetValue = Number(formData.budget);
    if (!Number.isFinite(budgetValue) || budgetValue < 0) {
      setError("Please enter a valid budget.");
      return;
    }

    const payload: CreateOfferPayload = {
      scoutListingId: scoutId,
      offerType: formData.offerType,
      title: formData.title.trim(),
      description: formData.description.trim(),
      budget: budgetValue,
      currency: formData.currency.trim() || undefined,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      location: formData.location.trim() || undefined,
    };

    if (!payload.title || !payload.description) {
      setError("Please complete the required fields.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await apiClient.createMarketplaceOffer(payload);
      toast.success("Offer sent to scout");
      onClose();
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unable to send offer";
      setError(message);
      toast.error("Unable to send offer", { description: message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Offer" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className={labelClassName}>Offer type *</label>
            <select
              value={formData.offerType}
              onChange={(event) =>
                setFormData({ ...formData, offerType: event.target.value as OfferType })
              }
              className={inputClassName}
              required
            >
              {offerTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClassName}>Budget (EUR) *</label>
            <input
              type="number"
              min={0}
              step={1}
              required
              value={formData.budget}
              onChange={(event) => setFormData({ ...formData, budget: event.target.value })}
              className={inputClassName}
              placeholder="1500"
            />
          </div>
        </div>

        <div>
          <label className={labelClassName}>Title *</label>
          <input
            type="text"
            required
            value={formData.title}
            onChange={(event) => setFormData({ ...formData, title: event.target.value })}
            className={inputClassName}
            placeholder="Scouting assignment for upcoming match"
          />
        </div>

        <div>
          <label className={labelClassName}>Description *</label>
          <textarea
            required
            rows={5}
            value={formData.description}
            onChange={(event) => setFormData({ ...formData, description: event.target.value })}
            className={`${inputClassName} resize-none`}
            placeholder="Tell the scout what you need: match details, profile focus, expected deliverables..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClassName}>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(event) => setFormData({ ...formData, location: event.target.value })}
              className={inputClassName}
              placeholder="Madrid, Spain"
            />
          </div>

          <div>
            <label className={labelClassName}>Start date</label>
            <input
              type="date"
              value={formData.startDate}
              onChange={(event) => setFormData({ ...formData, startDate: event.target.value })}
              className={inputClassName}
            />
          </div>

          <div>
            <label className={labelClassName}>End date</label>
            <input
              type="date"
              value={formData.endDate}
              onChange={(event) => setFormData({ ...formData, endDate: event.target.value })}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting} aria-busy={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send offer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
