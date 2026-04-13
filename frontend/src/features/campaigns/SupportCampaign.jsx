import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { ChevronLeft, Heart } from "lucide-react";
import { supportCheckoutApi } from "../../api/endpoints.js";

export default function SupportCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = React.useState(null);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [loadingCampaign, setLoadingCampaign] = React.useState(true);
  const [error, setError] = React.useState("");

  // Load campaign to get the full amount needed
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { campaignDetailApi } = await import("../../api/endpoints.js");
        const res = await campaignDetailApi(id);
        if (alive) setCampaign(res.campaign);
      } catch (e) {
        if (alive) setError("Could not load campaign details.");
      } finally {
        if (alive) setLoadingCampaign(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const amountNeededCents = campaign?.amount_needed_cents ?? campaign?.amountNeededCents ?? 0;
  const amountPooledCents = campaign?.amount_pooled_cents ?? campaign?.amountPooledCents ?? 0;
  const alreadyFunded = amountPooledCents >= amountNeededCents && amountNeededCents > 0;
  const loanAmountGbp = (amountNeededCents / 100).toFixed(0);
  const amount = loanAmountGbp;

  async function onProceed() {
    setError("");
    const gbp = Number(loanAmountGbp);
    if (!Number.isFinite(gbp) || gbp <= 0) {
      setError("Could not determine the loan amount.");
      return;
    }
    if (!acceptTerms) {
      setError("Please accept the Qard Hasan terms to continue.");
      return;
    }

    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/app/lender?payment=success`;
      const cancelUrl = `${window.location.origin}/app/campaigns/${id}`;

      const res = await supportCheckoutApi({
        campaignId: id,
        amountCents: Math.round(gbp * 100),
        currency: "GBP",
        returnUrl,
        cancelUrl,
        termsAccepted: acceptTerms,
      });

      const checkout = res.checkout || {};
      const url = checkout.checkout_url || checkout.checkoutUrl || checkout.url || checkout.redirect_url;

      if (!url) {
        setError("Checkout URL was not provided by the server. Please contact support.");
        return;
      }
      window.location.href = url;
    } catch (e) {
      setError("Sorry — we couldn't start checkout right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <div className="space-y-6 max-w-xl mx-auto">
        {/* Back link */}
        <button
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-muted)] hover:text-emerald-700 transition"
          onClick={() => navigate(`/app/campaigns/${id}`)}
        >
          <ChevronLeft className="w-4 h-4" />
          Back to campaign
        </button>

        <FadeIn>
          <Card
            title="Lend a Hand"
            subtitle="You're making an interest-free loan. You'll be redirected to secure checkout."
          >
            <div className="space-y-6">
              {/* Loan amount — fixed (1 lender funds the full amount) */}
              {loadingCampaign ? (
                <div className="flex items-center justify-center py-8">
                  <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : alreadyFunded ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                  <p className="text-lg font-semibold text-emerald-800 inline-flex items-center gap-2">This loan has already been funded <Heart className="w-5 h-5 text-emerald-600" /></p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-2">Thank you for your interest. Browse other campaigns to help someone else.</p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate("/app/home")}>Browse Campaigns</Button>
                </div>
              ) : (
              <div>
                <div className="mb-3 text-sm font-semibold text-[var(--color-text)]">Loan amount</div>
                <div className="rounded-xl border-2 border-emerald-600 bg-emerald-50 p-5 text-center">
                  <div className="text-3xl font-bold font-heading text-emerald-700">£{loanAmountGbp}</div>
                  <div className="text-sm text-[var(--color-text-muted)] mt-2">
                    As a single lender, you fund the full loan amount. The borrower repays you directly through the platform.
                  </div>
                </div>
              </div>
              )}

              {/* Qard Hasan terms */}
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-5 text-sm">
                <div className="font-bold text-emerald-800 font-heading text-base">Qard Hasan — The Benevolent Loan</div>
                <ul className="mt-3 space-y-2 text-[var(--color-text-muted)]">
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    This is an <strong>interest-free</strong> loan, not a donation.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    The borrower will repay the full amount by the stated date.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    Borrower identity is protected throughout.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    If the borrower faces hardship, you may choose to extend or forgive.
                  </li>
                  <li className="flex gap-2">
                    <span className="text-emerald-600 font-bold">•</span>
                    Repayment is handled securely through the platform.
                  </li>
                </ul>
              </div>

              {/* Terms checkbox */}
              <label className="flex items-start gap-3 rounded-xl border-2 border-[var(--color-border)] p-4 cursor-pointer hover:border-emerald-300 transition-all">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                />
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">
                    I understand and accept the Qard Hasan terms
                  </div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-1">
                    I acknowledge this is an interest-free loan and I accept the terms above.
                  </div>
                </div>
              </label>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
              )}
            </div>
          </Card>
        </FadeIn>

        {!alreadyFunded && !loadingCampaign && (
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1"
            size="lg"
            onClick={onProceed}
            disabled={loading || !acceptTerms}
          >
            {loading ? "Redirecting to checkout..." : `Lend £${amount}`}
          </Button>
        </div>
        )}
      </div>
    </Page>
  );
}
