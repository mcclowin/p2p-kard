import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import CategoryIcon from "../../components/ui/CategoryIcon.jsx";
import { Page } from "../../components/ui/Motion.jsx";
import { campaignDetailApi } from "../../api/endpoints.js";

export default function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [campaign, setCampaign] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await campaignDetailApi(id);
        if (!alive) return;
        setCampaign(res.campaign);
      } catch (e) {
        if (!alive) return;
        setError("Sorry — we couldn't load this campaign right now.");
      } finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [id]);

  if (loading) return <div className="text-slate-600 p-8">Loading…</div>;
  if (error) return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>;
  if (!campaign) return null;

  const needed = Number(campaign.amount_needed_cents ?? 0);
  const pooled = Number(campaign.amount_pooled_cents ?? 0);
  const campaignId = campaign.campaign_id ?? campaign.id ?? campaign.uuid ?? campaign.campaign_uuid;
  const locationArea = campaign.location_area ?? campaign.locationArea;

  return (
    <Page>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Card
          title={campaign.title_public}
          subtitle={
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-emerald-600">
                <CategoryIcon category={campaign.category} className="w-4 h-4" />
                {campaign.category}
              </span>
              {locationArea && (
                <span className="flex items-center gap-1 text-slate-500 text-sm">
                  📍 {locationArea}
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${campaign.verified ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {campaign.verified ? "Verified" : "Under review"}
              </span>
            </div>
          }
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-slate-600">
                Expected return: ~{campaign.expected_return_days} days
                {campaign.expected_return_date ? ` (by ${campaign.expected_return_date})` : ""}
              </div>
              <Button onClick={() => navigate(`/app/campaigns/${campaignId}/support`)}>
                Support this campaign
              </Button>
            </div>
          }
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs text-slate-500">Needed</div>
              <div className="mt-1 text-xl font-semibold">£{(needed / 100).toFixed(0)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs text-slate-500">Raised</div>
              <div className="mt-1 text-xl font-semibold text-emerald-700">£{(pooled / 100).toFixed(0)}</div>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <div className="text-xs text-slate-500">Progress</div>
              <div className="mt-1 text-xl font-semibold">{campaign.funding_progress_pct ?? "—"}%</div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <div className="text-sm font-semibold">Situation</div>
              <p className="mt-2 text-slate-700 whitespace-pre-wrap">{campaign.story_public}</p>
            </div>
            <div>
              <div className="text-sm font-semibold">Terms & repayment</div>
              <p className="mt-2 text-slate-700 whitespace-pre-wrap">{campaign.terms_public}</p>
            </div>
            <div className="text-xs text-slate-500">
              Borrower identity is protected. Our team verifies documents internally.
            </div>
          </div>
        </Card>

        <button className="text-sm font-semibold underline text-slate-700 hover:text-slate-900" onClick={() => navigate("/app/home")}>
          ← Back to campaigns
        </button>
      </div>
    </Page>
  );
}
