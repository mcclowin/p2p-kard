import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import CategoryIcon from "../../components/ui/CategoryIcon.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { campaignDetailApi, getEndorsementsForRequestApi, requestEndorserContactApi } from "../../api/endpoints.js";
import { useAuthStore } from "../../state/authStore.js";

function ProgressBar({ value = 0 }) {
  return (
    <div className="h-3 w-full rounded-full bg-emerald-100">
      <div
        className="h-3 rounded-full bg-emerald-600 transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}

function StatBox({ label, value, accent = false }) {
  return (
    <div className="rounded-xl bg-[var(--color-surface-warm)] p-5">
      <div className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wider">{label}</div>
      <div className={`mt-1.5 text-2xl font-bold font-heading ${accent ? "text-emerald-700" : "text-[var(--color-text)]"}`}>{value}</div>
    </div>
  );
}

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed } = useAuthStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [campaign, setCampaign] = React.useState(null);
  const [endorsements, setEndorsements] = React.useState([]);
  const [contactRequested, setContactRequested] = React.useState({});
  const [contactLoading, setContactLoading] = React.useState({});

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await campaignDetailApi(id);
        if (!alive) return;
        setCampaign(res.campaign);

        // Fetch endorsements for the borrow request
        const brId = res.campaign?.borrow_request_id || res.campaign?.borrowRequestId;
        if (brId) {
          try {
            const endRes = await getEndorsementsForRequestApi(brId);
            if (alive) setEndorsements(endRes.endorsements || []);
          } catch { /* endorsements not available, that's fine */ }
        }
      } catch (e) {
        if (!alive) return;
        setError("Sorry — we couldn't load this campaign right now.");
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  async function handleRequestContact(endorsementId) {
    setContactLoading((prev) => ({ ...prev, [endorsementId]: true }));
    try {
      await requestEndorserContactApi(endorsementId);
      setContactRequested((prev) => ({ ...prev, [endorsementId]: true }));
    } catch (e) {
      const detail = e?.response?.data?.detail || "Failed to send contact request.";
      alert(detail);
    } finally {
      setContactLoading((prev) => ({ ...prev, [endorsementId]: false }));
    }
  }

  if (loading) {
    return (
      <Page>
        <div className="flex items-center justify-center py-20">
          <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </Page>
    );
  }
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!campaign) return null;

  const needed = Number(campaign.amount_needed_cents ?? 0);
  const pooled = Number(campaign.amount_pooled_cents ?? 0);
  const campaignId = campaign.campaign_id ?? campaign.id ?? campaign.uuid ?? campaign.campaign_uuid;
  const locationArea = campaign.location_area ?? campaign.locationArea;
  const pct = needed > 0 ? Math.round((pooled / needed) * 100) : 0;

  return (
    <Page>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Back link */}
        <button
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-muted)] hover:text-emerald-700 transition"
          onClick={() => navigate("/app/home")}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to campaigns
        </button>

        {/* Header */}
        <FadeIn>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-[var(--shadow-md)]">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <CategoryIcon category={campaign.category} className="w-5 h-5" />
                <span className="text-sm font-semibold">{campaign.category}</span>
              </span>
              {locationArea && (
                <span className="flex items-center gap-1 text-[var(--color-text-muted)] text-sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  {locationArea}
                </span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${campaign.verified ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {campaign.verified ? "✓ Verified" : "Under review"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-heading leading-tight">{campaign.title_public}</h1>

            {/* Progress */}
            <div className="mt-6 space-y-3">
              <div className="grid gap-4 sm:grid-cols-3">
                <StatBox label="Needed" value={`£${(needed / 100).toLocaleString()}`} />
                <StatBox label="Raised" value={`£${(pooled / 100).toLocaleString()}`} accent />
                <StatBox label="Progress" value={`${pct}%`} />
              </div>
              <ProgressBar value={pct} />
            </div>
          </div>
        </FadeIn>

        {/* Story */}
        <FadeIn delay={0.05}>
          <Card title="Situation">
            <p className="text-[var(--color-text-muted)] whitespace-pre-wrap leading-relaxed">{campaign.story_public}</p>
          </Card>
        </FadeIn>

        {/* Terms */}
        <FadeIn delay={0.1}>
          <Card title="Terms & Repayment">
            <p className="text-[var(--color-text-muted)] whitespace-pre-wrap leading-relaxed">{campaign.terms_public}</p>
            <div className="mt-4 text-sm text-[var(--color-text-muted)]">
              Expected return: ~{campaign.expected_return_days} days
              {campaign.expected_return_date ? ` (by ${campaign.expected_return_date})` : ""}
            </div>
          </Card>
        </FadeIn>

        {/* Community Endorsement */}
        {endorsements.length > 0 && (
          <FadeIn delay={0.12}>
            <Card title="🤝 Community Endorsement">
              <div className="space-y-4">
                {endorsements.map((end) => (
                  <div key={end.id} className="space-y-3">
                    <div className="text-sm font-semibold text-[var(--color-text)]">
                      {end.endorserName}
                      {end.endorserTitle && <span className="text-[var(--color-text-muted)] font-normal"> — {end.endorserTitle}</span>}
                      {end.endorserAffiliation && <span className="text-[var(--color-text-muted)] font-normal">, {end.endorserAffiliation}</span>}
                    </div>
                    <blockquote className="border-l-4 border-emerald-300 pl-4 italic text-[var(--color-text-muted)]">
                      "{end.vouchText}"
                    </blockquote>
                    {isAuthed && !contactRequested[end.id] && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={contactLoading[end.id]}
                        onClick={() => handleRequestContact(end.id)}
                      >
                        {contactLoading[end.id] ? "Sending..." : "📩 Request Endorser Contact"}
                      </Button>
                    )}
                    {contactRequested[end.id] && (
                      <div className="text-sm text-emerald-700">
                        ✓ Contact request sent! The endorser will be notified by email. You'll receive their details once they approve.
                      </div>
                    )}
                    {!isAuthed && (
                      <div className="text-xs text-[var(--color-text-muted)]">
                        Log in to request the endorser's contact details.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Privacy note */}
        <div className="rounded-xl bg-[var(--color-earth-50)] border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)]">
          🛡️ Borrower identity is protected throughout. Our team verifies all documents internally.
        </div>

        {/* CTA */}
        <FadeIn delay={0.15}>
          {pooled >= needed && needed > 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-lg font-semibold text-emerald-800">This loan has been fully funded 💚</p>
              <Button variant="outline" className="mt-3" onClick={() => navigate("/app/home")}>Browse other campaigns</Button>
            </div>
          ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-[var(--color-surface-warm)] border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-muted)] text-center">
              This loan requires <strong>one lender</strong> to fund the full amount of <strong>£{(needed / 100).toLocaleString()}</strong>. The borrower repays you directly through the platform.
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="flex-1" onClick={() => navigate(`/app/campaigns/${campaignId}/support`)}>
                Fund this Loan — £{(needed / 100).toLocaleString()}
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate("/app/home")}>
                Browse other campaigns
              </Button>
            </div>
          </div>
          )}
        </FadeIn>
      </div>
    </Page>
  );
}
