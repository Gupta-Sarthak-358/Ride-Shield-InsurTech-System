import { formatCurrency, formatScore, humanizeSlug } from "../utils/formatters";

export default function PremiumCalculator({ selectedPlan }) {
  if (!selectedPlan) {
    return (
      <div className="panel p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/45">Premium model</p>
        <h3 className="mt-1 text-2xl font-bold">Weekly price formula</h3>
        <p className="mt-3 text-sm text-ink/60">
          Premiums follow the README formula: base price x plan factor x worker risk score, with guardrails on the final weekly charge.
        </p>
      </div>
    );
  }

  const premiumData = selectedPlan.premium_calculation || null;
  const displayName =
    selectedPlan.plan_display_name || selectedPlan.display_name || humanizeSlug(selectedPlan.plan_name || "selected_plan");
  const base = Number(premiumData?.base_price ?? selectedPlan.base_price ?? 0);
  const factor = Number(premiumData?.plan_factor ?? selectedPlan.plan_factor ?? 0);
  const risk = Number(premiumData?.risk_score ?? selectedPlan.risk_score ?? 0);
  const raw = Number(premiumData?.raw_premium ?? base * factor * risk);
  const finalPremium = selectedPlan.weekly_premium ?? premiumData?.final_premium ?? 0;
  const formula = premiumData?.formula;
  const hasFormulaBreakdown = Number.isFinite(base) && base > 0 && Number.isFinite(factor) && factor > 0 && Number.isFinite(risk) && risk > 0;

  return (
    <div className="panel p-6">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink/45">Premium model</p>
      <h3 className="mt-1 text-2xl font-bold">{displayName}</h3>
      <p className="mt-3 text-sm text-ink/60">
        {formula
          ? formula
          : hasFormulaBreakdown
            ? `Base ${formatCurrency(base)} x factor ${factor.toFixed(1)} x risk ${formatScore(risk)} = ${formatCurrency(raw)} before plan safeguards.`
            : "Detailed premium formula will appear once the pricing engine response is available for this worker."}
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-black/[0.03] p-4">
          <p className="text-sm text-ink/45">Final weekly premium</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(finalPremium)}</p>
        </div>
        <div className="rounded-2xl bg-black/[0.03] p-4">
          <p className="text-sm text-ink/45">Coverage cap</p>
          <p className="mt-2 text-2xl font-bold">{formatCurrency(selectedPlan.coverage_cap)}</p>
        </div>
      </div>
      {premiumData?.model_version ? (
        <div className="mt-4 rounded-2xl bg-black/[0.03] p-4 text-sm text-ink/65">
          <p>
            <span className="font-semibold">Pricing model:</span> {premiumData.model_version}{" "}
            {premiumData.fallback_used ? "- fallback active" : "- ML-assisted"}
          </p>
        </div>
      ) : null}
    </div>
  );
}
