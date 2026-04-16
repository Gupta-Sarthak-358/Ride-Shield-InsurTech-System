import { formatCurrency, formatDateTime, formatScore, humanizeSlug, statusPill } from "../utils/formatters";
import { workerClaimNarrative, workerFriendlyFactors } from "../utils/decisionNarrative";
import { useTranslation } from "react-i18next";
import WhatsAppPreview from "./WhatsAppPreview";

function renderTriggerList(triggers = [], t) {
  if (!triggers.length) {
    return t("claim.none");
  }
  return triggers.map(humanizeSlug).join(", ");
}

export default function ClaimDetailPanel({ claim }) {
  const { t } = useTranslation();
  if (!claim) {
    return (
      <div className="context-panel p-6">
        <div className="mb-5">
          <p className="eyebrow">{t("claim.claim_detail")}</p>
          <h3 className="mt-2 text-2xl font-bold text-primary">{t("claim.select")}</h3>
        </div>
        <p className="text-sm leading-6 text-on-surface-variant">
          {t("claim.pick")}
        </p>
      </div>
    );
  }

  const breakdown = claim.decision_breakdown || {};
  const inputs = breakdown.inputs || {};
  const components = breakdown.breakdown || {};
  const payoutBreakdown = claim.payout_breakdown || breakdown.payout_breakdown || {};
  const fraudModel = claim.fraud_model || breakdown.fraud_model || {};
  const incidentTriggers = inputs.incident_triggers || claim.decision_breakdown?.incident_triggers || [claim.trigger_type];
  const coveredTriggers = inputs.covered_triggers || claim.decision_breakdown?.covered_triggers || [];


  const workerFactors = workerFriendlyFactors(claim);
  const decisionExperience = claim.decision_experience || {};
  const behaviorLabel = decisionExperience.behavioral_label ? humanizeSlug(decisionExperience.behavioral_label) : null;

  return (
    <div className="context-panel p-6">
      <div className="mb-5">
        <p className="eyebrow">{t("claim.claim_detail")}</p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <span className={statusPill(claim.status)}>{humanizeSlug(claim.status)}</span>
          <h3 className="text-2xl font-bold text-primary">{renderTriggerList(incidentTriggers, t)}</h3>
        </div>
        <p className="mt-2 text-sm text-on-surface-variant">{formatDateTime(claim.created_at)}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("claim.decision_explanation")}</p>
          <p className="mt-3 text-sm leading-7 text-on-surface">
            {decisionExperience.summary || breakdown.explanation || claim.rejection_reason || t("claim.no_explanation")}
          </p>
          {decisionExperience.action_reason ? (
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{decisionExperience.action_reason}</p>
          ) : null}
          {decisionExperience.next_step ? (
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("claim.next_step")} {decisionExperience.next_step}</p>
          ) : null}
        </div>
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("claim.payout_impact")}</p>
          <p className="mt-3 text-lg font-semibold text-primary">
            {formatCurrency(claim.final_payout || claim.calculated_payout)}
          </p>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            {t("claim.hours_affected")} {claim.disruption_hours ?? "--"} - {t("claim.peak_multiplier")} {claim.peak_multiplier ?? "--"}
          </p>
          {payoutBreakdown.net_income_per_hour ? (
            <div className="mt-4 space-y-1 text-sm leading-6 text-on-surface-variant">
              <p>{t("claim.gross_hourly")} {formatCurrency(payoutBreakdown.income_per_hour)}</p>
              <p>{t("claim.net_protected")} {formatCurrency(payoutBreakdown.net_income_per_hour)}</p>
              <p>
                {t("claim.operating_cost")} {Math.round(Number(payoutBreakdown.operating_cost_factor || 0) * 100)}%
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {claim.income_loss && claim.income_loss.estimated_income_loss > 0 ? (
        <div className="mt-4 panel-quiet rounded-[24px] p-4" style={{ borderLeft: '4px solid var(--primary)' }}>
          <p className="eyebrow" style={{ fontSize: '0.75rem', letterSpacing: '0.08em', color: 'var(--on-surface-variant)' }}>
            {t("claim.income_protection")}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-sm text-on-surface-variant">{t("claim.income_loss")}</p>
              <p className="mt-1 text-lg font-bold" style={{ color: '#ef5350' }}>
                {formatCurrency(claim.income_loss.estimated_income_loss)}
              </p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">{t("claim.coverage")}</p>
              <p className="mt-1 text-lg font-bold" style={{ color: '#66bb6a' }}>
                {formatCurrency(claim.income_loss.payout_amount)}
              </p>
            </div>
            <div>
              <p className="text-sm text-on-surface-variant">{t("claim.coverage_ratio")}</p>
              <p className="mt-1 text-lg font-bold text-primary">
                {Math.round(claim.income_loss?.coverage_ratio * 100)}%
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <WhatsAppPreview claim={claim} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-sm text-on-surface-variant">{t("claim.decision_strength")}</p>
          <p className="mt-2 font-semibold text-primary">{formatScore(claim.final_score)}</p>
        </div>
        <div>
          <p className="text-sm text-on-surface-variant">{t("claim.payment_safety")}</p>
          <p className="mt-2 font-semibold text-primary">{formatScore(claim.fraud_score)}</p>
        </div>
        <div>
          <p className="text-sm text-on-surface-variant">{t("claim.incident_evidence")}</p>
          <p className="mt-2 font-semibold text-primary">{formatScore(claim.event_confidence)}</p>
        </div>
        <div>
          <p className="text-sm text-on-surface-variant">{t("claim.account_trust")}</p>
          <p className="mt-2 font-semibold text-primary">{formatScore(claim.trust_score)}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("claim.claim_checks")}</p>
          <p className="mt-2 text-lg font-semibold text-primary">
            {fraudModel.fraud_probability !== undefined
              ? `${Math.round(Number(fraudModel.fraud_probability || 0) * 100)}% check intensity`
              : t("claim.standard_checks")}
          </p>
          {behaviorLabel ? <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("claim.case_type")} {behaviorLabel}</p> : null}
          {Array.isArray(fraudModel.top_factors) && fraudModel.top_factors.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {workerFactors.map((factor) => (
                <span key={factor} className="pill" style={{ background: "rgba(120,53,0,0.3)", color: "#f4a135" }}>
                  {factor}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{t("claim.no_elevated")}</p>
          )}
        </div>
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("claim.worker_explanation")}</p>
          <p className="mt-2 text-sm leading-7 text-on-surface">
            {workerClaimNarrative(claim)}
          </p>
          {decisionExperience.confidence_note ? (
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">{decisionExperience.confidence_note}</p>
          ) : null}
          {behaviorLabel ? (
            <p className="mt-3 text-sm leading-6 text-on-surface-variant">
              {t("claim.claim_pattern")} <span className="font-semibold text-primary">{behaviorLabel}</span>
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("claim.incident_triggers")}</p>
          <p className="mt-2 text-sm leading-7 text-on-surface">{renderTriggerList(incidentTriggers, t)}</p>
          <p className="mt-3 text-sm text-on-surface-variant">{t("claim.covered_by_policy")}</p>
          <p className="mt-2 text-sm leading-7 text-on-surface">{renderTriggerList(coveredTriggers, t)}</p>
        </div>
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("claim.ai_decision_factors")}</p>
          <div className="mt-3 space-y-3">
            {[
              { label: t("claim.disruption_strength"), value: components.disruption_component, color: "#42a5f5" },
              { label: t("claim.incident_evidence"), value: components.confidence_component, color: "#66bb6a" },
              { label: t("claim.payment_safety_factor"), value: components.fraud_component, color: "#ef5350" },
              { label: t("claim.account_trust"), value: components.trust_component, color: "#ab47bc" },
              { label: t("claim.flag_penalty"), value: components.flag_penalty, color: "#ffa726" },
            ].map(({ label, value, color }) => {
              const pct = Math.round(Math.max(0, Math.min(1, Number(value || 0))) * 100);
              return (
                <div key={label}>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant mb-1">
                    <span>{label}</span>
                    <span className="font-semibold text-on-surface">{formatScore(value)}</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.08)" }}>
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "6px",
                        borderRadius: "3px",
                        background: color,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {fraudModel.confidence !== undefined ? (
            <p className="mt-4 text-xs text-on-surface-variant">
              {t("claim.model_confidence")} <span className="font-semibold text-on-surface">{Math.round(Number(fraudModel.confidence || 0) * 100)}%</span>
              {fraudModel.model_version ? ` · v${fraudModel.model_version}` : ""}
              {fraudModel.fallback_used ? ` · ${t("claim.fallback_mode")}` : ""}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
