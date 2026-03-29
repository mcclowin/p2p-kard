import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { dashboardApi } from "../../api/endpoints.js";

function Pill({ children, tone = "neutral" }) {
  const map = {
    neutral: "bg-[var(--color-surface-warm)] text-[var(--color-text-muted)] border border-[var(--color-border)]",
    good: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    warn: "bg-amber-50 text-amber-800 border border-amber-200/60",
  };
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-white p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-3">
        <div className="text-2xl">{icon}</div>
        <div>
          <div className="text-sm text-[var(--color-text-muted)]">{label}</div>
          <div className="text-2xl font-bold font-heading">{value}</div>
        </div>
      </div>
    </div>
  );
}

export default function LenderDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [data, setData] = React.useState(null);

  const paymentSuccess = new URLSearchParams(location.search).get("payment") === "success";

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await dashboardApi();
      setData(res);
    } catch (e) {
      setError("Sorry — we couldn't load your dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, []);

  const supportSummary = data?.support_summary && typeof data.support_summary === "object" ? data.support_summary : {};
  const supportByCampaign = Array.isArray(data?.support_by_campaign) ? data.support_by_campaign : [];
  const borrowRequests = Array.isArray(data?.borrow_requests) ? data.borrow_requests : [];

  return (
    <Page>
      <div className="space-y-8">
        {paymentSuccess && (
          <FadeIn>
            <div className="rounded-xl border border-emerald-200/60 bg-emerald-50 p-4 text-sm text-emerald-800 flex items-center gap-2">
              <span className="text-lg">💚</span>
              Thank you for your generosity. We're confirming your support now.
            </div>
          </FadeIn>
        )}

        {/* Header */}
        <FadeIn>
          <div>
            <h1 className="text-3xl font-bold font-heading">My Dashboard</h1>
            <p className="mt-1 text-[var(--color-text-muted)]">
              Track your loans, support, and community impact.
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
            {/* Stats */}
            <FadeIn delay={0.05}>
              <div className="grid gap-4 sm:grid-cols-3">
                <StatCard
                  label="Total lent"
                  value={supportSummary.total_supported_cents != null ? `£${(supportSummary.total_supported_cents / 100).toLocaleString()}` : "—"}
                  icon="💚"
                />
                <StatCard
                  label="Active loans"
                  value={supportSummary.active_supported_cents != null ? `£${(supportSummary.active_supported_cents / 100).toLocaleString()}` : "—"}
                  icon="⏳"
                />
                <StatCard
                  label="Returned"
                  value={supportSummary.returned_cents != null ? `£${(supportSummary.returned_cents / 100).toLocaleString()}` : "—"}
                  icon="✅"
                />
              </div>
            </FadeIn>

            {/* Lending activity */}
            <FadeIn delay={0.1}>
              <Card title="My Lending" subtitle="Campaigns you've supported.">
                <div className="space-y-3">
                  {supportByCampaign.map((x) => (
                    <div key={`${x.campaign_id}-${x.amount_cents}`} className="rounded-xl border border-[var(--color-border)] p-4 sm:p-5 flex items-start justify-between gap-4 hover:shadow-[var(--shadow-sm)] transition">
                      <div className="min-w-0">
                        <div className="text-base font-semibold font-heading break-words">{x.campaign_title}</div>
                        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                          Lent: <strong>£{(x.amount_cents / 100).toLocaleString()}</strong>
                        </div>
                        <div className="text-sm text-[var(--color-text-subtle)]">Expected return: {x.expected_return_date ?? "—"}</div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Pill tone={x.contribution_status === "RETURNED" ? "good" : "warn"}>
                          {x.contribution_status}
                        </Pill>
                        {["FUNDED", "DISBURSED", "IN_REPAYMENT", "COMPLETED"].includes(x.campaign_status) && x.campaign_id && (
                          <button
                            onClick={() => navigate(`/app/contracts/${x.campaign_id}`)}
                            className="text-xs text-emerald-700 hover:text-emerald-900 font-semibold underline underline-offset-2"
                          >
                            View agreement
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {!supportByCampaign.length && (
                    <div className="text-center py-8">
                      <p className="text-xl mb-2">🌱</p>
                      <p className="text-[var(--color-text-muted)]">You haven't lent to anyone yet.</p>
                      <Button size="sm" className="mt-4" onClick={() => navigate("/app/home")}>Browse campaigns</Button>
                    </div>
                  )}
                </div>
              </Card>
            </FadeIn>

            {/* Borrow requests */}
            <FadeIn delay={0.15}>
              <Card title="My Loan Requests" subtitle="If you've applied for a loan, its status appears here.">
                <div className="space-y-3">
                  {borrowRequests.map((r) => (
                    <div key={r.id} className="rounded-xl border border-[var(--color-border)] p-4 sm:p-5 flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="text-base font-semibold font-heading break-words">{r.title}</div>
                        <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                          Amount: <strong>£{((r.amount_requested_cents ?? r.amountRequestedCents ?? 0) / 100).toLocaleString()}</strong> • Repay: ~{r.expected_return_days ?? r.expectedReturnDays} days
                        </div>
                      </div>
                      <Pill tone={r.status === "VERIFIED" ? "good" : "neutral"}>{r.status}</Pill>
                    </div>
                  ))}
                  {!borrowRequests.length && (
                    <div className="text-center py-8">
                      <p className="text-[var(--color-text-muted)]">No loan requests yet.</p>
                      <Button size="sm" variant="outline" className="mt-4" onClick={() => navigate("/app/borrower/apply")}>Request a Loan</Button>
                    </div>
                  )}
                </div>
              </Card>
            </FadeIn>
          </>
        )}
      </div>
    </Page>
  );
}
