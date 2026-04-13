import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import CategoryIcon from "../../components/ui/CategoryIcon.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { MapPin, Check, FileText, Handshake, Mail, Shield, Heart, ChevronLeft } from "lucide-react";
import { campaignDetailApi, getEndorsementsForRequestApi, requestEndorserContactApi } from "../../api/endpoints.js";
import { useAuthStore } from "../../state/authStore.js";

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
            console.log("Endorsements response:", endRes);
            if (alive) setEndorsements(endRes.endorsements || []);
          } catch (endErr) { console.log("Endorsements fetch failed:", endErr?.response?.status, endErr?.message); }
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
  // 1:1 lending model — no progress bar needed

  return (
    <Page>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Back link */}
        <button
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-muted)] hover:text-emerald-700 transition"
          onClick={() => navigate("/app/home")}
        >
          <ChevronLeft className="w-4 h-4" />
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
                  <MapPin className="w-4 h-4" />
                  {locationArea}
                </span>
              )}
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium border ${campaign.verified ? "bg-emerald-50 text-emerald-700 border-emerald-200/60" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                {campaign.verified ? <span className="inline-flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span> : "Under review"}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold font-heading leading-tight">{campaign.title_public}</h1>

            {/* Loan details */}
            <div className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <StatBox label="Loan Amount" value={`£${(needed / 100).toLocaleString()}`} accent />
                <StatBox label="Repay Within" value={`${campaign.expected_return_days} days`} />
              </div>
              {pooled >= needed && needed > 0 && (
                <div className="mt-3 rounded-lg bg-emerald-50 border border-emerald-200/60 p-3 text-center text-sm font-semibold text-emerald-700">
                  <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" /> Fully funded by a single lender</span>
                </div>
              )}
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

        {/* Contract Preview */}
        <FadeIn delay={0.11}>
          <Card title={<span className="inline-flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-600" /> Loan Agreement Preview</span>}>
            <div className="space-y-4 text-sm text-[var(--color-text-muted)]">
              <p>
                If you fund this loan, a formal <strong className="text-[var(--color-text)]">Qard Hasan</strong> (benevolent loan) agreement will be created between you and the borrower, with HandUp as witness.
              </p>
              <div className="rounded-lg bg-[var(--color-surface-warm)] p-4 space-y-3">
                <div><strong className="text-[var(--color-text)]">Nature:</strong> Qard Hasan — the benevolent loan. Interest-free, rooted in compassion.</div>
                <div><strong className="text-[var(--color-text)]">Amount:</strong> £{(needed / 100).toLocaleString()}</div>
                <div><strong className="text-[var(--color-text)]">Repayment:</strong> Single repayment within {campaign.expected_return_days} days</div>
                <div><strong className="text-[var(--color-text)]">Zero Interest:</strong> No interest, late fees, hidden charges, or conditional benefits shall apply.</div>
                <div><strong className="text-[var(--color-text)]">Hardship:</strong> If the borrower faces genuine hardship, you may choose to extend or forgive — an act of virtue.</div>
                <div><strong className="text-[var(--color-text)]">Platform Role:</strong> HandUp acts as facilitator and witness, not a party to the loan.</div>
              </div>
              <p className="text-xs text-[var(--color-text-subtle)]">
                The borrower has pre-signed this agreement upon submission. By funding the loan, you sign as the lender and the contract becomes active.
              </p>
            </div>
          </Card>
        </FadeIn>

        {/* Community Endorsement */}
        {endorsements.length > 0 && (
          <FadeIn delay={0.12}>
            <Card title={<span className="inline-flex items-center gap-2"><Handshake className="w-5 h-5 text-emerald-600" /> Community Endorsement</span>}>
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
                        {contactLoading[end.id] ? "Sending..." : <span className="inline-flex items-center gap-1.5"><Mail className="w-4 h-4" /> Request Endorser Contact</span>}
                      </Button>
                    )}
                    {contactRequested[end.id] && (
                      <div className="text-sm text-emerald-700">
                        <Check className="w-4 h-4 inline" /> Contact request sent! The endorser will be notified by email. You'll receive their details once they approve.
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
          <span className="inline-flex items-center gap-1.5"><Shield className="w-4 h-4" /> Borrower identity is protected throughout.</span> Our team verifies all documents internally.
        </div>

        {/* CTA */}
        <FadeIn delay={0.15}>
          {pooled >= needed && needed > 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <p className="text-lg font-semibold text-emerald-800 inline-flex items-center gap-2">This loan has been fully funded <Heart className="w-5 h-5 text-emerald-600" /></p>
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
