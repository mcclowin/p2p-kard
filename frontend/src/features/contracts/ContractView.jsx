import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { FileEdit, PenLine, CheckCircle, PartyPopper, HeartHandshake, ChevronLeft, Printer } from "lucide-react";
import { contractDetailApi, contractSignApi } from "../../api/endpoints.js";

function StatusBanner({ status }) {
  const config = {
    GENERATED: { bg: "bg-amber-50 border-amber-200/60", text: "text-amber-800", icon: <FileEdit className="w-5 h-5" />, label: "Awaiting borrower signature" },
    BORROWER_SIGNED: { bg: "bg-blue-50 border-blue-200/60", text: "text-blue-800", icon: <PenLine className="w-5 h-5" />, label: "Signed by borrower" },
    ACTIVE: { bg: "bg-emerald-50 border-emerald-200/60", text: "text-emerald-800", icon: <CheckCircle className="w-5 h-5" />, label: "Active" },
    COMPLETED: { bg: "bg-[var(--color-surface-warm)] border-[var(--color-border)]", text: "text-[var(--color-text-muted)]", icon: <PartyPopper className="w-5 h-5" />, label: "Completed" },
    FORGIVEN: { bg: "bg-purple-50 border-purple-200/60", text: "text-purple-800", icon: <HeartHandshake className="w-5 h-5" />, label: "Forgiven (converted to Sadaqah)" },
  };
  const c = config[status] || config.GENERATED;
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${c.bg}`}>
      {c.icon}
      <span className={`text-sm font-semibold ${c.text}`}>Contract status: {c.label}</span>
    </div>
  );
}

export default function ContractView() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [contract, setContract] = React.useState(null);
  const [signing, setSigning] = React.useState(false);
  const [consentChecked, setConsentChecked] = React.useState(false);

  async function load() {
    setLoading(true); setError("");
    try {
      const res = await contractDetailApi(campaignId);
      setContract(res.contract);
    } catch (e) {
      setError("Sorry — we couldn't load the contract. Please try again.");
    } finally { setLoading(false); }
  }

  React.useEffect(() => { load(); }, [campaignId]);

  async function onSign() {
    setSigning(true); setError("");
    try {
      const res = await contractSignApi(campaignId);
      setContract(res.contract);
      setConsentChecked(false);
    } catch (e) {
      setError("Sorry — we couldn't sign the contract. Please try again.");
    } finally { setSigning(false); }
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

  if (error && !contract) {
    return (
      <Page><div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div></Page>
    );
  }

  if (!contract) return null;

  const isBorrowerUnsigned = contract.status === "GENERATED";

  return (
    <Page>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Back */}
        <button
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-muted)] hover:text-emerald-700 transition"
          onClick={() => navigate(-1)}
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-3xl font-bold font-heading">Qard Hasan Agreement</h1>
            <p className="mt-1 text-[var(--color-text-muted)]">
              Your formal interest-free loan agreement.
            </p>
          </div>
        </FadeIn>

        <StatusBanner status={contract.status} />

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        {/* Contract text */}
        <FadeIn delay={0.05}>
          <Card title="Contract">
            <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-[var(--color-text-muted)]">
              {contract.contractText || contract.contract_text}
            </pre>
          </Card>
        </FadeIn>

        {/* Sign */}
        {isBorrowerUnsigned && (
          <FadeIn delay={0.1}>
            <Card title="Sign this agreement">
              <div className="space-y-4">
                <label className="flex items-start gap-3 rounded-xl border-2 border-[var(--color-border)] p-4 cursor-pointer hover:border-emerald-300 transition">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">
                    I have read and understood the Qard Hasan (the benevolent loan — interest-free)
                    agreement above. I accept the terms and commit to repay the principal
                    amount in good faith.
                  </span>
                </label>
                <Button onClick={onSign} disabled={!consentChecked || signing}>
                  {signing ? "Signing..." : "Sign Agreement"}
                </Button>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Signed date */}
        {(contract.borrowerSignedAt || contract.borrower_signed_at) && (
          <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-4 text-sm text-emerald-800">
            <PenLine className="w-4 h-4 inline" /> Borrower signed on:{" "}
            {new Date(contract.borrowerSignedAt || contract.borrower_signed_at).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            <span className="inline-flex items-center gap-1.5"><Printer className="w-4 h-4" /> Print contract</span>
          </Button>
          <div className="text-xs text-[var(--color-text-subtle)] font-mono break-all">
            SHA-256: {contract.contractHash || contract.contract_hash}
          </div>
        </div>
      </div>
    </Page>
  );
}
