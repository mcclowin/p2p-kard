import React from "react";
import { useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page } from "../../components/ui/Motion.jsx";
import { contractDetailApi, contractSignApi } from "../../api/endpoints.js";

function StatusBanner({ status }) {
  const config = {
    GENERATED: { bg: "bg-amber-50 border-amber-200", text: "text-amber-800", label: "Awaiting borrower signature" },
    BORROWER_SIGNED: { bg: "bg-blue-50 border-blue-200", text: "text-blue-800", label: "Signed by borrower" },
    ACTIVE: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-800", label: "Active" },
    COMPLETED: { bg: "bg-slate-50 border-slate-200", text: "text-slate-700", label: "Completed" },
    FORGIVEN: { bg: "bg-purple-50 border-purple-200", text: "text-purple-800", label: "Forgiven" },
  };
  const c = config[status] || config.GENERATED;
  return (
    <div className={`rounded-2xl border p-4 text-sm font-semibold ${c.bg} ${c.text}`}>
      Contract status: {c.label}
    </div>
  );
}

export default function ContractView() {
  const { campaignId } = useParams();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [contract, setContract] = React.useState(null);
  const [signing, setSigning] = React.useState(false);
  const [consentChecked, setConsentChecked] = React.useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await contractDetailApi(campaignId);
      setContract(res.contract);
    } catch (e) {
      setError("Sorry — we couldn't load the contract. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  async function onSign() {
    setSigning(true);
    setError("");
    try {
      const res = await contractSignApi(campaignId);
      setContract(res.contract);
      setConsentChecked(false);
    } catch (e) {
      setError("Sorry — we couldn't sign the contract. Please try again.");
    } finally {
      setSigning(false);
    }
  }

  if (loading) {
    return (
      <Page>
        <div className="text-slate-600">Loading contract...</div>
      </Page>
    );
  }

  if (error && !contract) {
    return (
      <Page>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      </Page>
    );
  }

  if (!contract) return null;

  const isBorrowerUnsigned = contract.status === "GENERATED";

  return (
    <Page>
      <div className="space-y-6">
        <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-[0_18px_55px_rgba(2,6,23,0.10)] backdrop-blur">
          <div className="text-2xl font-semibold">Qard Hasan Agreement</div>
          <div className="mt-2 text-slate-600">
            Review the full contract below. This agreement governs the interest-free loan.
          </div>
        </div>

        <StatusBanner status={contract.status} />

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        <Card title="Contract text">
          <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-slate-800">
            {contract.contractText || contract.contract_text}
          </pre>
        </Card>

        {isBorrowerUnsigned && (
          <Card title="Sign this contract">
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">
                  I have read and understood the Qard Hasan (interest-free goodwill loan)
                  agreement above. I accept the terms and commit to repay the principal
                  amount in good faith.
                </span>
              </label>

              <Button onClick={onSign} disabled={!consentChecked || signing}>
                {signing ? "Signing..." : "Sign agreement"}
              </Button>
            </div>
          </Card>
        )}

        {contract.borrowerSignedAt || contract.borrower_signed_at ? (
          <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
            Borrower signed on:{" "}
            {new Date(contract.borrowerSignedAt || contract.borrower_signed_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button variant="outline" onClick={() => window.print()}>
            Print contract
          </Button>

          <div className="text-xs text-slate-500 font-mono break-all">
            SHA-256: {contract.contractHash || contract.contract_hash}
          </div>
        </div>
      </div>
    </Page>
  );
}
