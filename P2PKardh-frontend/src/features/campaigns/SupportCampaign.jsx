import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { supportCheckoutApi } from "../../api/endpoints.js";

const AMOUNT_PRESETS = [10, 25, 50, 100, 250, 500];

export default function SupportCampaign() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [amount, setAmount] = React.useState("25");
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function onProceed() {
    setError("");
    const gbp = Number(amount);
    if (!Number.isFinite(gbp) || gbp <= 0) {
      setError("Please enter a valid amount.");
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
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          Back to campaign
        </button>

        <FadeIn>
          <Card
            title="Lend a Hand"
            subtitle="You're making an interest-free loan. You'll be redirected to secure checkout."
          >
            <div className="space-y-6">
              {/* Amount presets */}
              <div>
                <div className="mb-3 text-sm font-semibold text-[var(--color-text)]">Choose an amount</div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {AMOUNT_PRESETS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      onClick={() => setAmount(String(a))}
                      className={`rounded-xl border-2 px-3 py-2.5 text-sm font-bold transition-all ${
                        amount === String(a)
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-[var(--color-border)] hover:border-emerald-300 text-[var(--color-text)]"
                      }`}
                    >
                      £{a}
                    </button>
                  ))}
                </div>
                <Input
                  label="Or enter a custom amount (£)"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  hint="Please lend responsibly. Thank you for your kindness."
                />
              </div>

              {/* Qard Hasan terms */}
              <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-5 text-sm">
                <div className="font-bold text-emerald-800 font-heading text-base">Qard Hasan — The Beautiful Loan</div>
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

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            className="flex-1"
            size="lg"
            onClick={onProceed}
            disabled={loading || !acceptTerms}
          >
            {loading ? "Redirecting to checkout..." : `Lend £${amount || "0"}`}
          </Button>
        </div>
      </div>
    </Page>
  );
}
