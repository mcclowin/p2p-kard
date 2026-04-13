import React from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Input from "../../components/ui/Input.jsx";
import CategoryIcon from "../../components/ui/CategoryIcon.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { Handshake, Shield, Building2, PenLine, Search, Heart, RefreshCw, Sprout, MapPin, Check } from "lucide-react";
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
    endorserName: c?.endorser_name ?? c?.endorserName ?? null,
  };
}

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-2 w-full rounded-full bg-emerald-100">
      <div
        className="h-2 rounded-full bg-emerald-600 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function CampaignCard({ c, onOpen, onSupport }) {
  const pct = c.amountNeeded > 0 ? Math.round((c.pooled / c.amountNeeded) * 100) : 0;

  return (
    <div
      className="group h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] transition-all duration-300 cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-700">
          <CategoryIcon category={c.category} className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">{c.category}</span>
        </div>
        {c.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/60">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
            Verified
          </span>
        )}
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug font-heading group-hover:text-emerald-800 transition-colors">{c.title}</h3>

      {c.locationArea && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <MapPin className="w-3.5 h-3.5" />
          {c.locationArea}
        </div>
      )}

      {c.endorserName && (
        <div className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-emerald-700">
          <Handshake className="w-3.5 h-3.5" /> Endorsed by {c.endorserName}
        </div>
      )}

      <div className="mt-1 text-sm text-[var(--color-text-subtle)]">
        Repayment: ~{c.expectedReturnDays} days
      </div>

      <div className="mt-auto pt-5 space-y-2">
        <div className="flex justify-between text-sm items-center">
          <span className="text-lg font-bold font-heading text-emerald-700">£{c.amountNeeded.toLocaleString()}</span>
          {c.pooled >= c.amountNeeded && c.amountNeeded > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/60 rounded-full px-2.5 py-0.5"><Check className="w-3 h-3" /> Funded</span>
          ) : (
            <span className="text-xs text-[var(--color-text-muted)]">Needs 1 lender</span>
          )}
        </div>
      </div>

      <div className="mt-4">
        {c.status === "running" ? (
          <Button
            className="w-full"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onSupport();
            }}
          >
            Lend a Hand
          </Button>
        ) : (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200/60 px-3 py-2 text-center text-sm font-semibold text-emerald-700">
            <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" /> Fully funded</span>
          </div>
        )}
      </div>
    </div>
  );
}

function QardHasanExplainer() {
  return (
    <FadeIn delay={0.15}>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-10 shadow-[var(--shadow-md)]">
        <h2 className="text-2xl font-bold text-emerald-900 font-heading">What is Qard Hasan?</h2>
        <p className="mt-4 text-[var(--color-text-muted)] leading-relaxed max-w-2xl">
          <em className="text-emerald-800">Qard Hasan</em> (قرض حسن) means "the benevolent loan" — an interest-free loan given purely
          to help someone in need. Rooted in Islamic tradition but open to everyone, it's the idea that
          money should serve people, not exploit them.
        </p>
        <blockquote className="mt-5 border-l-4 border-emerald-400 pl-5 text-base italic text-[var(--color-text-muted)]">
          "Who is it that will lend Allah a goodly loan, that He may multiply it for him
          and there will be a noble reward for him?"
          <span className="block mt-1 not-italic text-sm font-semibold text-emerald-700">— Quran 57:11</span>
        </blockquote>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { icon: <Handshake className="w-6 h-6 text-emerald-600" />, title: "Zero Interest", desc: "No hidden fees, ever" },
            { icon: <Shield className="w-6 h-6 text-emerald-600" />, title: "Identity Protected", desc: "Dignity preserved always" },
            { icon: <Building2 className="w-6 h-6 text-emerald-600" />, title: "Community-Powered", desc: "Neighbours helping neighbours" },
          ].map((item) => (
            <div key={item.title} className="rounded-xl bg-[var(--color-surface)] border border-[var(--color-border-light)] p-4 text-center shadow-[var(--shadow-sm)]">
              <div className="flex justify-center">{item.icon}</div>
              <div className="mt-2 text-sm font-semibold text-[var(--color-text)]">{item.title}</div>
              <div className="mt-1 text-xs text-[var(--color-text-muted)]">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Request a loan",
      desc: "Tell us what you need and why. Your identity stays protected throughout.",
      icon: <PenLine className="w-7 h-7 text-emerald-600" />,
    },
    {
      num: "02",
      title: "Get verified",
      desc: "Quick ID check and bank link to keep the community safe for everyone.",
      icon: <Search className="w-7 h-7 text-emerald-600" />,
    },
    {
      num: "03",
      title: "Get endorsed",
      desc: "Invite a trusted community member to vouch for you. Builds trust with lenders.",
      icon: <Handshake className="w-7 h-7 text-emerald-600" />,
    },
    {
      num: "04",
      title: "Receive support",
      desc: "A single lender funds your full amount — zero interest, zero fees.",
      icon: <Heart className="w-7 h-7 text-emerald-600" />,
    },
    {
      num: "05",
      title: "Repay when able",
      desc: "Pay it back by the agreed date. If you're struggling, we'll work it out together.",
      icon: <RefreshCw className="w-7 h-7 text-emerald-600" />,
    },
  ];

  return (
    <FadeIn delay={0.2}>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-text)] font-heading">How It Works</h2>
          <p className="mt-2 text-[var(--color-text-muted)]">Simple, transparent, dignified.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((step) => (
            <div key={step.num} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[var(--shadow-sm)] text-center">
              <div className="flex justify-center mb-3">{step.icon}</div>
              <div className="text-xs font-bold text-emerald-600 tracking-wider uppercase mb-2">Step {step.num}</div>
              <h3 className="text-base font-semibold font-heading">{step.title}</h3>
              <p className="mt-2 text-sm text-[var(--color-text-muted)] leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </FadeIn>
  );
}

function LocationFilter({ onFilter, onClear, activeArea }) {
  const [postcode, setPostcode] = React.useState("");
  const [resolving, setResolving] = React.useState(false);
  const [lookupError, setLookupError] = React.useState("");

  async function handleLookup() {
    const clean = postcode.replace(/\s+/g, "").trim();
    if (!clean) return;
    setResolving(true);
    setLookupError("");
    try {
      const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(clean)}`);
      const data = await res.json();
      if (data.status === 200 && data.result) {
        const ward = data.result.admin_ward || "";
        const district = data.result.admin_district || "";
        const area = ward && district ? `${ward}, ${district}` : district || ward;
        if (area) {
          onFilter(area, district);
        } else {
          setLookupError("Couldn't resolve area from this postcode.");
        }
      } else {
        setLookupError("Invalid postcode. Please try again.");
      }
    } catch {
      setLookupError("Couldn't look up postcode. Check your connection.");
    } finally {
      setResolving(false);
    }
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col sm:flex-row gap-3 items-end">
        <div className="flex-1 min-w-0">
          <label className="block">
            <div className="mb-1.5 text-sm font-semibold text-[var(--color-text)]">
              <MapPin className="w-4 h-4 inline-block mr-1" />
              Find campaigns near you
            </div>
            <input
              className="w-full rounded-xl border border-[var(--color-border)] px-4 py-2.5 text-sm bg-[var(--color-surface)] outline-none transition focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-[var(--color-text-subtle)]"
              value={postcode}
              onChange={(e) => setPostcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLookup()}
              placeholder="Enter your postcode (e.g. E8 1DY)"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={handleLookup} disabled={resolving || !postcode.trim()}>
            {resolving ? "Looking up..." : "Search"}
          </Button>
          {activeArea && (
            <Button size="sm" variant="outline" onClick={() => { setPostcode(""); onClear(); }}>
              Clear
            </Button>
          )}
        </div>
      </div>
      {lookupError && <div className="mt-2 text-xs text-red-600">{lookupError}</div>}
      {activeArea && (
        <div className="mt-2 text-sm text-emerald-700 font-medium">
          Showing campaigns near: <strong>{activeArea}</strong>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { isAuthed } = useAuthStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [running, setRunning] = React.useState([]);
  const [completed, setCompleted] = React.useState([]);
  const [filterArea, setFilterArea] = React.useState("");
  const [filterDistrict, setFilterDistrict] = React.useState("");

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
      <div className="space-y-12">
        {/* ─── Hero ─── */}
        <FadeIn>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-900 p-8 sm:p-12 lg:p-16 text-white shadow-[var(--shadow-xl)]">
            {/* Decorative circles */}
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-emerald-600/20 blur-3xl" />
            <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-emerald-500/15 blur-2xl" />

            <div className="relative z-10">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight font-heading">
                Community loans.<br />
                Zero interest.<br />
                <span className="text-emerald-200">Full dignity.</span>
              </h1>
              <p className="mt-5 max-w-xl text-emerald-100 text-lg leading-relaxed">
                HandUp connects people facing emergencies with neighbours willing to give
                interest-free loans. No shame, no profit — just people helping people.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="!bg-white !text-emerald-800 !border-white hover:!bg-emerald-50 font-bold"
                  size="lg"
                  onClick={() => navigate(isAuthed ? "/app/borrower/apply" : "/register")}
                >
                  Request a Loan
                </Button>
                <Button
                  variant="outline"
                  className="!bg-white !text-emerald-800 !border-white hover:!bg-emerald-50 font-bold"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById("active-campaigns");
                    if (el) el.scrollIntoView({ behavior: "smooth" });
                    else navigate("/app/home");
                  }}
                >
                  Lend a Hand
                </Button>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* ─── Qard Hasan Explainer ─── */}
        <QardHasanExplainer />

        {/* ─── How It Works ─── */}
        <HowItWorks />

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {/* ─── Active Campaigns ─── */}
        <FadeIn delay={0.1}>
          <section id="active-campaigns" className="space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold font-heading">People Who Need Help</h2>
                <p className="mt-1 text-[var(--color-text-muted)]">
                  Your support is returned to you. Every loan is interest-free.
                </p>
              </div>
            </div>

            {/* Location filter */}
            <LocationFilter
              activeArea={filterArea}
              onFilter={(area, district) => { setFilterArea(area); setFilterDistrict(district); }}
              onClear={() => { setFilterArea(""); setFilterDistrict(""); }}
            />

            {(() => {
              const filteredRunning = filterDistrict
                ? running.filter((c) => {
                    if (!c.locationArea) return false;
                    const loc = c.locationArea.toLowerCase();
                    return loc.includes(filterDistrict.toLowerCase());
                  })
                : running;

              return (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
              {loading ? (
                <div className="col-span-full text-center py-12 text-[var(--color-text-muted)]">
                  <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
                  <p>Loading campaigns…</p>
                </div>
              ) : filteredRunning.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Sprout className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
                  <p className="text-[var(--color-text-muted)]">
                    {filterArea ? `No active campaigns found near ${filterArea}.` : "No active campaigns at the moment. Check back soon."}
                  </p>
                  {filterArea && (
                    <Button size="sm" variant="outline" className="mt-3" onClick={() => { setFilterArea(""); setFilterDistrict(""); }}>
                      Show all campaigns
                    </Button>
                  )}
                </div>
              ) : (
                filteredRunning.map((c) => (
                  <CampaignCard
                    key={c.id}
                    c={c}
                    onOpen={() => navigate(`/app/campaigns/${c.id}`)}
                    onSupport={() => navigate(`/app/campaigns/${c.id}`)}
                  />
                ))
              )}
            </div>
              );
            })()}
          </section>
        </FadeIn>

        {/* ─── Completed Campaigns ─── */}
        {completed.length > 0 && (
          <FadeIn delay={0.2}>
            <section className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold font-heading">Community Impact</h2>
                <p className="mt-1 text-[var(--color-text-muted)]">
                  These loans reached their goal. Thank you to every lender.
                </p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 items-stretch">
                {completed.map((c) => (
                  <CampaignCard
                    key={c.id}
                    c={c}
                    onOpen={() => navigate(`/app/campaigns/${c.id}`)}
                    onSupport={() => navigate(`/app/campaigns/${c.id}`)}
                  />
                ))}
              </div>
            </section>
          </FadeIn>
        )}

        {/* ─── CTA Section ─── */}
        <FadeIn delay={0.25}>
          <div className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-8 sm:p-12 text-center shadow-[var(--shadow-md)]">
            <h2 className="text-2xl sm:text-3xl font-bold font-heading">Ready to make a difference?</h2>
            <p className="mt-3 text-[var(--color-text-muted)] max-w-lg mx-auto">
              Whether you need support or want to lend a hand, you're in the right place.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate(isAuthed ? "/app/borrower/apply" : "/register")}
              >
                Request a Loan
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const el = document.getElementById("active-campaigns");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Lend a Hand
              </Button>
            </div>
          </div>
        </FadeIn>
      </div>
    </Page>
  );
}
