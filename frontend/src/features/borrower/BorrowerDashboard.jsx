import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import CategoryIcon from "../../components/ui/CategoryIcon.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { MapPin, FileText, Clock, Handshake, Lightbulb, HandHelping } from "lucide-react";
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

function ChevronIcon({ expanded, className = "" }) {
  return (
    <svg
      className={`w-5 h-5 transition-transform duration-200 ${expanded ? "rotate-180" : ""} ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export default function BorrowerDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [data, setData] = React.useState(null);
  const [expandedId, setExpandedId] = React.useState(null);

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

  function toggleExpand(id) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

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
                    const isExpanded = expandedId === r.id;
                    const story = r.reason_detailed || [r.what_happened, r.how_funds_used].filter(Boolean).join("\n\nFunds usage: ");
                    const docCount = r.document_count ?? r.documents_count ?? r.documents?.length ?? 0;
                    const createdDate = r.created_at || r.createdAt;
                    const amountCents = r.amount_requested_cents ?? r.amountRequestedCents ?? 0;
                    const amountGbp = amountCents ? (amountCents / 100) : 0;

                    return (
                      <div key={r.id} className="rounded-xl border border-[var(--color-border)] overflow-hidden">
                        {/* Header row — clickable */}
                        <button
                          type="button"
                          onClick={() => toggleExpand(r.id)}
                          className="w-full p-4 sm:p-5 flex items-start justify-between gap-4 text-left hover:bg-[var(--color-surface-warm)] transition-colors"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-semibold font-heading break-words">{r.title}</div>
                            <div className="mt-1 text-sm text-[var(--color-text-muted)]">
                              Amount: <strong>£{amountGbp.toLocaleString()}</strong> • Repay: ~{r.expected_return_days} days
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Pill tone={r.status === "VERIFIED" || isFunded ? "good" : "neutral"}>{r.status}</Pill>
                            <ChevronIcon expanded={isExpanded} className="text-[var(--color-text-muted)]" />
                          </div>
                        </button>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-[var(--color-border)] p-4 sm:p-5 space-y-4 bg-[var(--color-surface)]">
                            {/* Category & Location */}
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="flex items-center gap-2 text-sm">
                                <CategoryIcon category={r.category} className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium">{r.category || "—"}</span>
                              </div>
                              {(r.city || r.postcode) && (
                                <div className="text-sm text-[var(--color-text-muted)]">
                                  <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {[r.city, r.postcode].filter(Boolean).join(", ")}</span>
                                </div>
                              )}
                            </div>

                            {/* Story */}
                            {story && (
                              <div className="rounded-lg bg-[var(--color-surface-warm)] p-4">
                                <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider mb-1.5">Your Story</div>
                                <p className="text-sm text-[var(--color-text-muted)] whitespace-pre-line">{story}</p>
                              </div>
                            )}

                            {/* Documents & Created date */}
                            <div className="flex flex-wrap gap-4 text-sm text-[var(--color-text-muted)]">
                              <span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" /> {docCount} document{docCount !== 1 ? "s" : ""} uploaded</span>
                              {createdDate && (
                                <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Created {new Date(createdDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                              )}
                            </div>

                            {/* Endorsement status */}
                            {(() => {
                              const endorsement = r.endorsement;
                              if (endorsement?.status === "INVITED") {
                                return (
                                  <div className="rounded-lg bg-amber-50/60 border border-amber-200/40 p-3 text-sm text-amber-800">
                                    <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Endorsement invite sent to <strong>{endorsement.inviteEmail}</strong> — awaiting response</span>
                                  </div>
                                );
                              }
                              if (endorsement?.status === "COMPLETED") {
                                return (
                                  <div className="rounded-lg bg-emerald-50/60 border border-emerald-200/40 p-3 text-sm text-emerald-800">
                                    <span className="inline-flex items-center gap-1"><Handshake className="w-3.5 h-3.5" /> Endorsed by <strong>{endorsement.endorserName}</strong></span>
                                    {endorsement.endorserTitle ? ` (${endorsement.endorserTitle})` : ""}
                                  </div>
                                );
                              }
                              return (
                                <div className="rounded-lg bg-blue-50/60 border border-blue-200/40 p-3 text-sm text-blue-800">
                                  <span className="inline-flex items-center gap-1"><Lightbulb className="w-3.5 h-3.5" /> Tip: Invite a community member to endorse your request to build trust with potential lenders.</span>
                                </div>
                              );
                            })()}

                            {/* Contract preview */}
                            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                              <h3 className="text-sm font-bold text-[var(--color-text)] font-heading">
                                <span className="inline-flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-600" /> Qard Hasan Contract Preview</span>
                              </h3>

                              <div className="text-sm text-[var(--color-text-muted)] space-y-3">
                                <div>
                                  <span className="font-semibold text-[var(--color-text)]">1. Nature:</span> This is a Qard Hasan (benevolent loan) — an interest-free loan rooted in the Islamic tradition of compassionate lending, open to all regardless of faith.
                                </div>
                                <div>
                                  <span className="font-semibold text-[var(--color-text)]">2. Terms:</span> £{amountGbp.toLocaleString()} to be repaid in full within {r.expected_return_days} days. Zero interest, zero fees.
                                </div>
                                <div>
                                  <span className="font-semibold text-[var(--color-text)]">3. Hardship:</span> If you face genuine hardship, the lender is encouraged to grant an extension or forgive part/all of the debt.
                                </div>
                                <div>
                                  <span className="font-semibold text-[var(--color-text)]">4. Platform:</span> HandUp acts as facilitator and independent witness.
                                </div>
                              </div>

                              <div className="rounded-lg bg-amber-50 border border-amber-200/60 p-3 text-xs text-amber-800">
                                <strong>Note:</strong> This contract was pre-signed by you upon submission. The lender's name will be added once your request is funded.
                              </div>

                              {isFunded && campaignId && (
                                <Button
                                  size="sm"
                                  onClick={() => navigate(`/app/contracts/${campaignId}`)}
                                >
                                  View Full Contract
                                </Button>
                              )}
                            </div>

                            {/* Funded contract section (kept from original) */}
                            {isFunded && campaignId && (
                              <div className="rounded-lg bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-5 h-5 text-emerald-600" />
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
                        )}

                        {/* Non-expanded: still show funded contract inline */}
                        {!isExpanded && isFunded && campaignId && (
                          <div className="border-t border-[var(--color-border)] p-4 sm:p-5">
                            <div className="rounded-lg bg-[var(--color-surface-warm)] border border-[var(--color-border-light)] p-4 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-emerald-600" />
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
                                onClick={(e) => { e.stopPropagation(); navigate(`/app/contracts/${campaignId}`); }}
                              >
                                View Contract
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {!borrowRequests.length && (
                    <div className="text-center py-10">
                      <HandHelping className="w-7 h-7 mx-auto mb-3 text-emerald-500" />
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
