import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { dashboardApi } from "../../api/endpoints.js";

function Pill({ children, tone = "neutral" }) {
  const map = {
    neutral: "bg-[var(--color-surface-warm)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
    good: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warn: "bg-amber-50 text-amber-800 border border-amber-200/60",
    info: "bg-blue-50 text-blue-700 border border-blue-200/60",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

function contractStatusTone(status) {
  if (status === "ACTIVE" || status === "COMPLETED") return "good";
  if (status === "BORROWER_SIGNED") return "info";
  if (status === "GENERATED") return "warn";
  return "neutral";
}

function contractStatusLabel(status) {
  const labels = {
    GENERATED: "Awaiting signature",
    BORROWER_SIGNED: "Signed",
    ACTIVE: "Active",
    COMPLETED: "Completed",
    FORGIVEN: "Forgiven",
  };
  return labels[status] || status;
}

export default function BorrowerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [data, setData] = React.useState(null);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await dashboardApi();
        if (alive) setData(res);
      } catch (e) {
        if (alive) setError("Sorry — we couldn't load your dashboard right now.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const borrowRequests = Array.isArray(data?.borrow_requests) ? data.borrow_requests : [];
  const supportByCampaign = Array.isArray(data?.support_by_campaign) ? data.support_by_campaign : [];

  // Find campaigns where the user is the borrower with an active/funded status
  const fundedLoans = borrowRequests.filter((r) =>
    ["VERIFIED", "FUNDED", "DISBURSED", "IN_REPAYMENT", "ACTIVE", "COMPLETED"].includes(r.status)
  );

  return (
    <Page>
      <div className="space-y-8">
        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-3xl font-bold font-heading">Borrower Dashboard</h1>
            <p className="mt-1 text-[var(--color-text-muted)]">
              Track your loan requests, contracts, and repayment status.
            </p>
          </div>
        </FadeIn>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Loan requests */}
            <FadeIn delay={0.05}>
              <Card title="My Loan Requests" subtitle="Your submitted requests and their status.">
                <div className="space-y-3">
                  {borrowRequests.map((r) => {
                    const campaignId = r.campaign_id || r.campaignId;
                    const isFunded = ["FUNDED", "DISBURSED", "IN_REPAYMENT", "ACTIVE", "COMPLETED"].includes(r.status);
                    const contractStatus = r.contract_status || r.contractStatus;

                    return (
                      <div key={r.id} className="rounded-xl border border-[var(--color-border)] p-4 sm:p-5 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="text-base font-semibold font-heading break-words">{r.title}</div>
                            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                              Amount: <strong>£{(r.amount_requested_cents / 100).toLocaleString()}</strong> • Repay: ~{r.expected_return_days} days
                            </div>
                          </div>
                          <Pill tone={r.status === "VERIFIED" || isFunded ? "good" : "neutral"}>{r.status}</Pill>
                        </div>

                        {/* Contract section for funded loans */}
                        {isFunded && campaignId && (
                          <div className="rounded-lg bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] p-4 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <span className="text-xl">📜</span>
                              <div>
                                <div className="text-sm font-semibold text-[var(--color-text)]">Loan Agreement</div>
                                <div className="text-xs text-[var(--color-text-muted)]">
                                  {contractStatus
                                    ? `Status: ${contractStatusLabel(contractStatus)}`
                                    : "View your Qard Hasan contract"}
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/app/contracts/${campaignId}`)}
                            >
                              View Contract
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!borrowRequests.length && (
                    <div className="text-center py-10">
                      <p className="text-2xl mb-3">🤲</p>
                      <p className="text-[var(--color-text-muted)] mb-1">You haven't submitted a loan request yet.</p>
                      <p className="text-sm text-[var(--color-text-subtle)] mb-4">
                        If you're facing an emergency, we're here to help — with dignity.
                      </p>
                      <Button onClick={() => navigate("/app/borrower/apply")}>
                        Request a Loan
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            </FadeIn>

            {/* Quick note */}
            <div className="rounded-xl bg-emerald-50/60 border border-emerald-200/40 p-4 text-sm text-[var(--color-text-muted)]">
              <strong className="text-emerald-800">Your privacy matters.</strong> Your identity is protected from lenders during the campaign.
              It is only shared in the formal loan agreement after your campaign is funded.
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
