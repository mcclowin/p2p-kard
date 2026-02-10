import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page } from "../../components/ui/Motion.jsx";
import { supportCheckoutApi } from "../../api/endpoints.js";

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
        <Card
          title="Support this campaign"
          subtitle="You'll be redirected to a secure checkout."
          footer={
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={() => navigate(`/app/campaigns/${id}`)}>
                Back to details
              </Button>
              <Button onClick={onProceed} disabled={loading || !acceptTerms}>
                {loading ? "Redirecting..." : "Proceed to support"}
              </Button>
            </div>
          }
        >
          <div className="space-y-5">
            <Input
              label="Amount (£)"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              hint="Please support responsibly. Thank you for your kindness."
            />

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-sm text-slate-700">
              <div className="font-semibold text-emerald-800">Qard Hasan — Interest-Free Loan</div>
              <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
                <li>This is an <strong>interest-free</strong> loan (Qard Hasan), not a donation.</li>
                <li>The borrower is expected to repay the full amount by the stated date.</li>
                <li>Borrower identity is protected throughout.</li>
                <li>If the borrower faces hardship, you may be asked to extend or forgive the loan.</li>
                <li>Repayment is handled securely through the platform.</li>
              </ul>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border p-4 cursor-pointer hover:bg-slate-50 transition">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
              />
              <div>
                <div className="text-sm font-semibold text-slate-800">
                  I understand and accept the Qard Hasan terms
                </div>
                <div className="text-xs text-slate-500">
                  I acknowledge this is an interest-free loan and accept the terms above.
                </div>
              </div>
            </label>

            {error && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
            )}
          </div>
        </Card>
      </div>
    </Page>
  );
}
