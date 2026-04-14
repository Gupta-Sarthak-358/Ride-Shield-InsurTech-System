import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Activity, ArrowRight, CalendarDays, Clock3, MapPin, Radar, ShieldCheck, Wallet, Zap } from "lucide-react";

import SectionHeader from "../components/SectionHeader";

const workerFlow = [
  {
    step: "howItWorks.workerFlow.step1_step", title: "howItWorks.workerFlow.step1_title", body: "howItWorks.workerFlow.step1_body",
  },
  {
    step: "howItWorks.workerFlow.step2_step", title: "howItWorks.workerFlow.step2_title", body: "howItWorks.workerFlow.step2_body",
  },
  {
    step: "howItWorks.workerFlow.step3_step", title: "howItWorks.workerFlow.step3_title", body: "howItWorks.workerFlow.step3_body",
  },
  {
    step: "howItWorks.workerFlow.step4_step", title: "howItWorks.workerFlow.step4_title", body: "howItWorks.workerFlow.step4_body",
  },
  {
    step: "howItWorks.workerFlow.step5_step", title: "howItWorks.workerFlow.step5_title", body: "howItWorks.workerFlow.step5_body",
  },
];

const policyEngine = [
  { title: "howItWorks.policyEngine.weekly_cover", detail: "howItWorks.policyEngine.weekly_cover_detail" },
  { title: "howItWorks.policyEngine.trigger_aware", detail: "howItWorks.policyEngine.trigger_aware_detail" },
  { title: "howItWorks.policyEngine.waiting_period", detail: "howItWorks.policyEngine.waiting_period_detail" },
  { title: "howItWorks.policyEngine.zone_logic", detail: "howItWorks.policyEngine.zone_logic_detail" },
];

const engineSections = [
  {
    title: "howItWorks.systemLayers.trigger_engine", text: "howItWorks.systemLayers.trigger_engine_detail",
  },
  {
    title: "howItWorks.systemLayers.claim_processor", text: "howItWorks.systemLayers.claim_processor_detail",
  },
  {
    title: "howItWorks.systemLayers.decision_engine", text: "howItWorks.systemLayers.decision_engine_detail",
  },
  {
    title: "howItWorks.systemLayers.payout_executor", text: "howItWorks.systemLayers.payout_executor_detail",
  },
];

export default function HowItWorks() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "How RideShield Works";
  }, []);

  return (
    <div className="space-y-12">
      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="hero-glow hero-mesh rounded-[36px] p-8 sm:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">{t("howItWorks.hero_eyebrow")}</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-bold leading-tight sm:text-5xl">
            {t("howItWorks.hero_title")}
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/78 sm:text-lg">
            {t("howItWorks.hero_desc")}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/onboarding" className="button-secondary !bg-white !text-primary">
              {t("howItWorks.btn_explore")}
              <ArrowRight size={18} />
            </Link>
            <Link to="/auth" className="rounded-[20px] bg-white/10 px-5 py-3 font-semibold text-white transition hover:bg-white/15">
              {t("howItWorks.btn_signin")}
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="context-panel p-6">
            <p className="eyebrow">{t("howItWorks.promise_eyebrow")}</p>
            <p className="mt-3 text-2xl font-bold leading-tight text-primary">
              {t("howItWorks.promise_text")}
            </p>
          </div>
          <div className="context-panel p-6">
            <p className="text-sm text-on-surface-variant">{t("howItWorks.diff_eyebrow")}</p>
            <p className="mt-2 text-lg font-semibold text-primary">
              {t("howItWorks.diff_text")}
            </p>
          </div>
        </div>
      </section>

      <section className="hero-glow hero-mesh rounded-[32px] p-8 sm:p-10 text-white">
        <SectionHeader
          eyebrow={t("howItWorks.workerFlow.eyebrow")}
          title={t("howItWorks.workerFlow.title")}
          description={t("howItWorks.workerFlow.desc")}
          invert
        />
        <div className="grid gap-4 md:grid-cols-5">
          {workerFlow.map((item) => (
            <div key={t(item.step)} className="rounded-[24px] bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-white/55">{t(item.step)}</p>
              <h3 className="mt-3 text-xl font-bold">{t(item.title)}</h3>
              <p className="mt-3 text-sm leading-7 text-white/78">{t(item.body)}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow={t("howItWorks.policyEngine.eyebrow")}
          title={t("howItWorks.policyEngine.title")}
          description={t("howItWorks.policyEngine.desc")}
        />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {policyEngine.map((item, index) => {
            const Icon = [CalendarDays, Zap, Clock3, MapPin][index];
            return (
              <div key={t(item.title)} className="context-panel p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-surface-container-low text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-primary">{t(item.title)}</h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{t(item.detail)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow={t("howItWorks.systemLayers.eyebrow")}
          title={t("howItWorks.systemLayers.title")}
          description={t("howItWorks.systemLayers.desc")}
        />
        <div className="grid gap-5 md:grid-cols-2">
          {engineSections.map(({ title, text }, index) => {
            const Icon = [Radar, Activity, ShieldCheck, Wallet][index];
            return (
              <div key={t(title)} className="context-panel p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-surface-container-low text-primary">
                  <Icon size={22} />
                </div>
                <h3 className="mt-5 text-xl font-bold text-primary">{t(title)}</h3>
                <p className="mt-3 text-sm leading-7 text-on-surface-variant">{t(text)}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
