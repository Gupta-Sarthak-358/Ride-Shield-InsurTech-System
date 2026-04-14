import { useTranslation } from "react-i18next";
import { formatDateTime, formatPercent, humanizeSlug, statusPill } from "../utils/formatters";

export default function EventPanel({ events = [] }) {
  const { t } = useTranslation();

  return (
    <div className="panel p-6">
      <div className="mb-5">
        <p className="eyebrow">{t("dashboard.disruptionFeed.eyebrow")}</p>
        <h3 className="mt-2 text-2xl font-bold text-primary">{t("dashboard.disruptionFeed.title")}</h3>
        <p className="mt-2 text-sm leading-6 text-on-surface-variant">
          {t("dashboard.disruptionFeed.desc")}
        </p>
      </div>

      <div className="space-y-3">
        {events.length ? (
          events.map((event) => {
            const triggers = event.metadata_json?.fired_triggers || [event.event_type];
            const confidence = event.event_confidence ? Number(event.event_confidence) * 100 : null;

            return (
              <div key={event.id} className="panel-quiet rounded-[24px] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={statusPill(event.status)}>{humanizeSlug(event.status)}</span>
                      <p className="text-sm font-semibold text-primary">{triggers.map(humanizeSlug).join(", ")}</p>
                    </div>
                    <p className="mt-2 text-sm text-on-surface-variant">
                      {humanizeSlug(event.zone)} | {humanizeSlug(event.city)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-on-surface-variant">
                      {t("dashboard.disruptionFeed.merge_note")}
                    </p>
                  </div>

                  <div className="text-right text-sm">
                    <p className="font-semibold text-primary">{formatPercent((event.disruption_score || 0) * 100)}</p>
                    <p className="mt-1 text-on-surface-variant">{formatDateTime(event.started_at)}</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-on-surface-variant">
                  <span className="pill-neutral">Triggers {triggers.length}</span>
                  {confidence !== null ? <span className="pill-neutral">Confidence {formatPercent(confidence)}</span> : null}
                  <span className="pill-neutral">Claims {event.claims_generated}</span>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-on-surface-variant">{t("dashboard.disruptionFeed.empty")}</p>
        )}
      </div>
    </div>
  );
}
