import { useTranslation } from "react-i18next";
import { formatCurrency, formatDateTime, humanizeSlug, statusPill } from "../utils/formatters";

export default function PayoutHistory({ data }) {
  const { t } = useTranslation();

  if (!data) {
    return null;
  }

  return (
    <div className="panel p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow">{t("dashboard.payoutLedger.eyebrow")}</p>
          <h3 className="mt-2 text-2xl font-bold text-primary">{t("dashboard.payoutLedger.title")}</h3>
        </div>
        <div className="text-right">
          <p className="text-sm text-on-surface-variant">{t("dashboard.payoutLedger.total")}</p>
          <p className="text-xl font-bold text-primary">{formatCurrency(data.total_amount)}</p>
        </div>
      </div>

      <div className="space-y-3">
        {(data.payouts || []).slice(0, 6).map((payout) => (
          <div key={payout.id} className="panel-quiet flex items-center justify-between rounded-[24px] px-4 py-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-primary">{formatCurrency(payout.amount)}</p>
                <span className={statusPill(payout.status)}>{humanizeSlug(payout.status)}</span>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">
                {payout.channel}
                {payout.transaction_id ? ` | ${payout.transaction_id}` : " | awaiting transfer reference"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-on-surface-variant">{formatDateTime(payout.completed_at || payout.initiated_at)}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {payout.status === "failed"
                  ? t("dashboard.payoutLedger.backup_needed")
                  : payout.status === "processing"
                    ? t("dashboard.payoutLedger.in_progress")
                    : payout.status === "pending"
                      ? t("dashboard.payoutLedger.queued")
                      : t("dashboard.payoutLedger.completed")}
              </p>
            </div>
          </div>
        ))}
        {!data.payouts?.length ? <p className="text-sm text-on-surface-variant">{t("dashboard.payoutLedger.empty")}</p> : null}
      </div>
    </div>
  );
}
