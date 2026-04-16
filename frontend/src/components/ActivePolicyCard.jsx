import { useTranslation } from "react-i18next";
import { Clock3, ShieldCheck } from "lucide-react";

import { formatCurrency, formatDateTime, humanizeSlug, statusPill } from "../utils/formatters";

export default function ActivePolicyCard({ policy, pendingPolicy }) {
  const { t } = useTranslation();

  if (!policy && !pendingPolicy) {
    return (
      <div className="panel p-6">
        <p className="eyebrow">{t("dashboard.coverage.eyebrow")}</p>
        <h3 className="mt-2 text-xl font-bold text-primary">{t("dashboard.coverage.no_policy")}</h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">{t("dashboard.coverage.no_policy_desc")}</p>
      </div>
    );
  }

  const data = policy || pendingPolicy;

  return (
    <div className="panel p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="eyebrow">{t("dashboard.coverage.eyebrow")}</p>
          <h3 className="mt-2 text-2xl font-bold text-primary">{data.display_name || humanizeSlug(data.plan_name)}</h3>
        </div>
        <span className={statusPill(data.status || (policy ? "active" : "pending"))}>{policy ? t("dashboard.status.active") : t("dashboard.status.pending")}</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("dashboard.coverage.premium")}</p>
          <p className="mt-2 text-xl font-bold text-primary">{policy ? formatCurrency(data.weekly_premium) : "--"}</p>
        </div>
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{t("dashboard.coverage.cap")}</p>
          <p className="mt-2 text-xl font-bold text-primary">{policy ? formatCurrency(data.coverage_cap) : "--"}</p>
        </div>
        <div className="panel-quiet rounded-[24px] p-4">
          <p className="text-sm text-on-surface-variant">{policy ? t("dashboard.coverage.expires") : t("dashboard.coverage.activates")}</p>
          <p className="mt-2 text-sm font-semibold text-primary">{formatDateTime(policy ? data.expires_at : data.activates_at)}</p>
        </div>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[24px] bg-[linear-gradient(135deg,#003527_0%,#064e3b_100%)] px-4 py-4 text-white">
        {policy ? <ShieldCheck size={18} className="mt-0.5" /> : <Clock3 size={18} className="mt-0.5" />}
        <div className="text-sm leading-6">
          {policy ? (
            <p>{t("dashboard.coverage.triggers_prefix")}{(data.triggers_covered || []).map(humanizeSlug).join(", ")}</p>
          ) : (
            <p>{t("dashboard.coverage.activation_in", { hours: Math.ceil(data.hours_until_activation || 0) })}</p>
          )}
        </div>
      </div>
    </div>
  );
}
