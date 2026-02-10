import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import CategoryIcon from "../../components/ui/CategoryIcon.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { homeApi } from "../../api/endpoints.js";
import { useAuthStore } from "../../state/authStore.js";

function normalizeCampaign(c) {
  const id = c?.campaign_id ?? c?.id ?? c?.uuid ?? c?.campaign_uuid;
  const hasNeededCents = c?.amount_needed_cents != null;
  const hasPooledCents = c?.amount_pooled_cents != null;
  const amountNeeded = hasNeededCents
    ? Math.round(Number(c.amount_needed_cents) / 100)
    : Number(c?.amount_needed ?? c?.amountNeeded ?? 0);
  const pooled = hasPooledCents
    ? Math.round(Number(c.amount_pooled_cents) / 100)
    : Number(c?.amount_pooled ?? c?.pooled ?? 0);
  const rawStatus = c?.status ?? "running";
  const status = typeof rawStatus === "string" ? rawStatus.toLowerCase() : "running";

  return {
    id,
    title: c?.title_public ?? c?.title ?? "Campaign",
    category: c?.category ?? "Other",
    amountNeeded,
    pooled,
    expectedReturnDays: c?.expected_return_days ?? c?.expectedReturnDays ?? 0,
    status,
    verified: c?.verified ?? c?.is_verified ?? false,
    locationArea: c?.location_area ?? c?.locationArea ?? null,
  };
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2.5 w-full rounded-full bg-emerald-100">
      <div
        className="h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function CampaignCard({ c, onOpen, onSupport }) {
  const pct = c.amountNeeded > 0 ? Math.round((c.pooled / c.amountNeeded) * 100) : 0;

  return (
    <div
      className="h-full rounded-3xl border border-slate-200/70 bg-white p-6 shadow-sm hover:shadow-lg transition cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-600">
          <CategoryIcon category={c.category} className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wide">{c.category}</span>
        </div>
        {c.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Verified
          </span>
        )}
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug">{c.title}</h3>

      {c.locationArea && (
        <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          {c.locationArea}
        </div>
      )}

      <div className="mt-1 text-sm text-slate-500">
        Return: ~{c.expectedReturnDays} days
      </div>

      <div className="mt-auto pt-5 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-semibold text-emerald-700">£{c.pooled} raised</span>
          <span className="text-slate-500">of £{c.amountNeeded}</span>
        </div>
        <ProgressBar value={pct} />
        <div className="text-xs text-slate-400">{pct}% funded</div>
      </div>

      <div className="mt-4">
        {c.status === "running" ? (
          <Button
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSupport();
            }}
          >
            Support
          </Button>
        ) : (
          <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm font-semibold text-emerald-700">
            ✓ Completed
          </div>
        )}
      </div>
    </div>
  );
}

function QardHasanExplainer() {
  return (
    <FadeIn delay={0.15}>
      <div className="rounded-3xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-white p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-emerald-800">What is Qard Hasan?</h2>
        <p className="mt-3 text-slate-600 leading-relaxed">
          <em>Qard Hasan</em> (قرض حسن) means "benevolent loan" — an interest-free loan given purely
          to help someone in need. Rooted in Islamic tradition but open to everyone, it's the idea that
          money should serve people, not exploit them.
        </p>
        <blockquote className="mt-4 border-l-4 border-emerald-300 pl-4 text-sm italic text-slate-500">
          "Who is it that will lend Allah a goodly loan, that He may multiply it for him
          and there will be a noble reward for him?" — Quran 57:11
        </blockquote>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/80 p-4 text-center">
            <div className="text-2xl">🤝</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">Zero Interest</div>
            <div className="mt-1 text-xs text-slate-500">No hidden fees, ever</div>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-center">
            <div className="text-2xl">🛡️</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">Identity Protected</div>
            <div className="mt-1 text-xs text-slate-500">Dignity preserved always</div>
          </div>
          <div className="rounded-2xl bg-white/80 p-4 text-center">
            <div className="text-2xl">🏘️</div>
            <div className="mt-1 text-sm font-semibold text-slate-800">Community-Powered</div>
            <div className="mt-1 text-xs text-slate-500">Neighbours helping neighbours</div>
          </div>
        </div>
      </div>
    </FadeIn>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthed } = useAuthStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [running, setRunning] = React.useState([]);
  const [completed, setCompleted] = React.useState([]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await homeApi();
        if (!alive) return;
        const runningCampaigns = Array.isArray(res?.running_campaigns)
          ? res.running_campaigns.map(normalizeCampaign).filter((c) => c.id)
          : [];
        const completedCampaigns = Array.isArray(res?.completed_campaigns)
          ? res.completed_campaigns.map(normalizeCampaign).filter((c) => c.id)
          : [];
        setRunning(runningCampaigns);
        setCompleted(completedCampaigns);
      } catch (e) {
        if (!alive) return;
        setError("Sorry — we couldn't load campaigns right now.");
        setRunning([]);
        setCompleted([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <Page>
      <div className="space-y-8">
        {/* Hero */}
        <FadeIn>
          <div className="rounded-3xl bg-gradient-to-br from-emerald-600 to-teal-700 p-10 text-white shadow-xl">
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
              Community loans, zero interest,<br />full dignity.
            </h1>
            <p className="mt-4 max-w-2xl text-emerald-100 text-lg leading-relaxed">
              HandUp connects people facing emergencies with community members willing to give
              interest-free loans. No shame, no profit — just people helping people.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              {isAuthed ? (
                <Button
                  className="!bg-white !text-emerald-700 hover:!bg-emerald-50 !shadow-none"
                  onClick={() => navigate("/app/borrower/apply")}
                >
                  Request support
                </Button>
              ) : (
                <>
                  <Button
                    className="!bg-white !text-emerald-700 hover:!bg-emerald-50 !shadow-none"
                    onClick={() => navigate("/register")}
                  >
                    Get started
                  </Button>
                  <Button
                    variant="outline"
                    className="!border-white/30 !text-white hover:!bg-white/10"
                    onClick={() => navigate("/login")}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </div>
          </div>
        </FadeIn>

        {/* Qard Hasan Explainer */}
        <QardHasanExplainer />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* Running campaigns */}
        <FadeIn delay={0.1}>
          <Card
            title="Active campaigns"
            subtitle="Your support helps complete the pool. Every contribution is returned to you."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 items-stretch">
              {loading ? (
                <div className="text-slate-600">Loading...</div>
              ) : running.length === 0 ? (
                <div className="text-slate-500 col-span-full">No active campaigns at the moment. Check back soon.</div>
              ) : (
                running.map((c) => (
                  <CampaignCard
                    key={c.id}
                    c={c}
                    onOpen={() => navigate(`/app/campaigns/${c.id}`)}
                    onSupport={() => navigate(`/app/campaigns/${c.id}/support`)}
                  />
                ))
              )}
            </div>
          </Card>
        </FadeIn>

        {/* Completed */}
        <FadeIn delay={0.2}>
          <Card
            title="Previously completed"
            subtitle="Thank you. These campaigns reached their goal."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 items-stretch">
              {loading ? (
                <div className="text-slate-600">Loading...</div>
              ) : completed.length === 0 ? (
                <div className="text-slate-500 col-span-full">No completed campaigns yet.</div>
              ) : (
                completed.map((c) => (
                  <CampaignCard
                    key={c.id}
                    c={c}
                    onOpen={() => navigate(`/app/campaigns/${c.id}`)}
                    onSupport={() => navigate(`/app/campaigns/${c.id}/support`)}
                  />
                ))
              )}
            </div>
          </Card>
        </FadeIn>
      </div>
    </Page>
  );
}
