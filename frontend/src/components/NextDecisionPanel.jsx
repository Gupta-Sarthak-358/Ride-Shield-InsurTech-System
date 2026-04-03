import { formatCurrency, humanizeSlug, statusPill } from "../utils/formatters";

/**
 * Admin-facing next-decision panel — surfaces the top grouped incident
 * that requires manual review, with fraud score, payout at risk, and
 * a contextual narrative.
 *
 * Extracted from AdminPanel.jsx to keep the page file focused on data
 * orchestration rather than sub-component layout.
 *
 * @param {{ incident: object|null }} props
 */
export default function NextDecisionPanel({ incident }) {
  if (!incident) {
    return (
      <div className="decision-panel p-6">
        <p className="eyebrow">Next decision</p>
        <h3 className="mt-3 text-2xl font-bold text-primary">No delayed claim needs action right now.</h3>
        <p className="mt-4 text-sm leading-7 text-on-surface-variant">
          The review queue is clear. Logs, incidents, and forecast cards below are supporting context rather than active
          blockers.
        </p>
      </div>
    );
  }

  const triggerTypes = Array.isArray(incident.trigger_types)
    ? incident.trigger_types
    : incident.trigger_type
      ? [incident.trigger_type]
      : [];
  const topFactors = Array.isArray(incident.top_factors) ? incident.top_factors.slice(0, 3) : [];
  const fraudProbability =
    incident.max_fraud_probability === null || incident.max_fraud_probability === undefined
      ? null
      : Math.round(Number(incident.max_fraud_probability || 0) * 100);

  return (
    <div className="decision-panel p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Next decision</p>
          <h3 className="mt-3 text-2xl font-bold text-primary">{incident.worker_name}</h3>
        </div>
        <span className={statusPill(incident.status)}>{humanizeSlug(incident.status)}</span>
      </div>

      <p className="mt-4 text-sm leading-7 text-on-surface-variant">
        {(triggerTypes.length ? triggerTypes.map(humanizeSlug).join(", ") : "No trigger context")} -{" "}
        {humanizeSlug(incident.zone || "zone")}
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-[20px] border border-primary/10 bg-surface-container-high/75 p-4">
          <p className="text-sm text-on-surface-variant">Fraud score</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {Math.round(Number(incident.max_fraud_score || 0) * 100)}%
          </p>
        </div>
        <div className="rounded-[20px] border border-primary/10 bg-surface-container-high/75 p-4">
          <p className="text-sm text-on-surface-variant">Payout at risk</p>
          <p className="mt-2 text-2xl font-bold text-primary">
            {formatCurrency(incident.total_calculated_payout)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] border border-primary/10 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Fraud probability</p>
          <p className="mt-2 text-lg font-semibold text-primary">{fraudProbability === null ? "--" : `${fraudProbability}%`}</p>
          <p className="mt-2 text-xs text-on-surface-variant">
            {incident.fraud_model_version || "rule-based"} {incident.fraud_fallback_used ? "- fallback" : "- hybrid active"}
          </p>
        </div>
        <div className="rounded-[18px] border border-primary/10 bg-surface-container-low p-4">
          <p className="text-sm text-on-surface-variant">Top suspicious factors</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {topFactors.length ? (
              topFactors.map((factor) => (
                <span key={factor.factor} className="pill-neutral">
                  {factor.label}
                </span>
              ))
            ) : (
              <span className="text-sm text-on-surface-variant">No ML factors available.</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-[20px] border border-primary/10 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-primary">Why this is surfaced first</p>
        <p className="mt-3 text-sm leading-7 text-on-surface-variant">
          This grouped incident is already delayed and should be resolved before the passive logs below. Operational
          review should start here, not in the feed history.
        </p>
      </div>
    </div>
  );
}
