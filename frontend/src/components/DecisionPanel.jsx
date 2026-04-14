import { useTranslation } from "react-i18next";
import { decisionConfidenceCopy, humanizeSlug, statusPill } from "../utils/formatters";
import { workerClaimNarrative, workerNextStep } from "../utils/decisionNarrative";

/**
 * Worker-facing decision panel — shows the most relevant claim context,
 * the confidence score, and a plain-English explanation of the decision.
 *
 * Extracted from Dashboard.jsx to make it independently importable and testable.
 *
 * @param {{ claim: object|null, narrative: string }} props
 */
export default function DecisionPanel({ claim, narrative }) {
  const { t } = useTranslation();

  const decisionState = claim?.status || "idle";
  const confidenceLabel = decisionConfidenceCopy(claim?.decision_confidence_band, claim?.status);

  let heading = t("dashboard.decisionPanel.heading_idle");
  let reason =
    t("dashboard.decisionPanel.reason_idle");
  let nextStep = t("dashboard.decisionPanel.next_idle");

  if (claim?.status === "delayed") {
    heading = t("dashboard.decisionPanel.heading_delayed");
    reason = workerClaimNarrative(claim);
    nextStep = workerNextStep(claim);
  } else if (claim?.status === "approved") {
    heading = t("dashboard.decisionPanel.heading_approved");
    reason = workerClaimNarrative(claim);
    nextStep = workerNextStep(claim);
  } else if (claim?.status === "rejected") {
    heading = t("dashboard.decisionPanel.heading_rejected");
    reason = workerClaimNarrative(claim);
    nextStep = workerNextStep(claim);
  }

  return (
    <div className="decision-panel card-primary p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{t("dashboard.decisionPanel.eyebrow")}</p>
          <h2 className="mt-3 text-2xl font-bold leading-tight text-primary">{heading}</h2>
        </div>
        <span className={statusPill(decisionState)}>{humanizeSlug(decisionState)}</span>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <span className="pill bg-primary/10 text-primary">{confidenceLabel}</span>
        {claim?.id ? <span className="pill bg-white text-on-surface-variant">{t("dashboard.decisionPanel.claim")} {claim.id.slice(0, 6)}</span> : null}
      </div>

      <div className="mt-5 panel-quiet rounded-[24px] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">{t("dashboard.decisionPanel.why_matters")}</p>
        <p className="mt-3 text-sm leading-6 text-on-surface">{reason}</p>
      </div>

      <div className="mt-5 panel-quiet rounded-[24px] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">{t("dashboard.decisionPanel.what_next")}</p>
        <p className="mt-3 text-sm leading-6 text-on-surface">{nextStep}</p>
      </div>

      <div className="mt-5 panel-quiet rounded-[24px] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-on-surface-variant">{t("dashboard.decisionPanel.narrative")}</p>
        <p className="mt-3 text-sm leading-6 text-on-surface">{narrative}</p>
      </div>
    </div>
  );
}
