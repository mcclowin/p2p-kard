import React from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { useAuthStore } from "../../state/authStore.js";
import {
  getEndorsementByTokenApi,
  completeEndorsementApi,
  respondEndorserContactRequestApi,
} from "../../api/endpoints.js";

export default function EndorserVouch() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthed } = useAuthStore();

  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);
  const [endorsement, setEndorsement] = React.useState(null);
  const [contactConsentLoading, setContactConsentLoading] = React.useState(false);
  const [contactConsentResult, setContactConsentResult] = React.useState("");

  // Form fields
  const [endorserName, setEndorserName] = React.useState("");
  const [endorserTitle, setEndorserTitle] = React.useState("");
  const [endorserAffiliation, setEndorserAffiliation] = React.useState("");
  const [vouchText, setVouchText] = React.useState("");
  const [contactMethod, setContactMethod] = React.useState("email");
  const [contactValue, setContactValue] = React.useState("");

  React.useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await getEndorsementByTokenApi(token);
        if (!alive) return;
        setEndorsement(res.endorsement);

        const requestId = searchParams.get("respond");
        const action = searchParams.get("action");
        if (requestId && (action === "approve" || action === "decline")) {
          setContactConsentLoading(true);
          try {
            await respondEndorserContactRequestApi(requestId, action);
            if (!alive) return;
            setContactConsentResult(
              action === "approve"
                ? "Thanks — you've approved sharing your contact details. The lender will receive them by email."
                : "You've declined this contact request. Your details have not been shared."
            );
          } catch (e) {
            if (!alive) return;
            setError(e?.response?.data?.detail || "Could not process this contact request.");
          } finally {
            if (alive) setContactConsentLoading(false);
          }
        }
      } catch (e) {
        if (alive) setError("Could not load endorsement. The link may be invalid or expired.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [token, searchParams]);

  async function handleSubmit() {
    setError("");
    if (!endorserName.trim()) return setError("Please enter your name.");
    if (!vouchText.trim() || vouchText.trim().length < 20) return setError("Please write a vouch (at least 20 characters).");

    if (!isAuthed) {
      return setError("You need to be logged in to submit an endorsement. Please register or log in first.");
    }

    setSubmitting(true);
    try {
      await completeEndorsementApi(token, {
        endorser_name: endorserName.trim(),
        endorser_title: endorserTitle.trim(),
        endorser_affiliation: endorserAffiliation.trim(),
        vouch_text: vouchText.trim(),
        contact_method: contactMethod,
        contact_value: contactValue.trim(),
      });
      setSuccess(true);
    } catch (e) {
      const detail = e?.response?.data?.detail || e?.message || "Failed to submit endorsement.";
      setError(detail);
    } finally {
      setSubmitting(false);
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

  if (error && !endorsement) {
    return (
      <Page>
        <div className="max-w-xl mx-auto text-center py-12">
          <div className="text-4xl mb-4">😔</div>
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        </div>
      </Page>
    );
  }

  if (!endorsement) return null;

  const isCompleted = endorsement.status === "COMPLETED";
  const amountGbp = endorsement.borrowRequestAmountCents
    ? (endorsement.borrowRequestAmountCents / 100).toLocaleString()
    : "—";

  // Already completed
  if (isCompleted && !success) {
    return (
      <Page>
        <div className="max-w-xl mx-auto space-y-6">
          <FadeIn>
            <div className="text-center py-8 space-y-4">
              <div className="inline-flex w-16 h-16 rounded-full bg-emerald-100 items-center justify-center text-3xl">🤝</div>
              <h2 className="text-2xl font-bold font-heading">Endorsement Already Submitted</h2>
              <p className="text-[var(--color-text-muted)]">This endorsement has already been completed.</p>
            </div>
          </FadeIn>
          <FadeIn delay={0.05}>
            <Card title="Endorsement">
              <div className="space-y-3">
                <div className="text-sm"><strong>{endorsement.endorserName}</strong> — {endorsement.endorserTitle}{endorsement.endorserAffiliation ? `, ${endorsement.endorserAffiliation}` : ""}</div>
                <blockquote className="border-l-4 border-emerald-300 pl-4 italic text-[var(--color-text-muted)]">
                  "{endorsement.vouchText}"
                </blockquote>
              </div>
            </Card>
          </FadeIn>
        </div>
      </Page>
    );
  }

  // Success state
  if (success) {
    return (
      <Page>
        <div className="max-w-xl mx-auto text-center py-12 space-y-6">
          <FadeIn>
            <div className="inline-flex w-20 h-20 rounded-full bg-emerald-100 items-center justify-center text-4xl">✓</div>
            <h2 className="text-2xl font-bold font-heading mt-4">Thank You for Your Endorsement</h2>
            <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
              The borrower will be notified. Your endorsement helps build trust with potential lenders.
            </p>
            <div className="pt-4">
              <Button onClick={() => navigate("/app/home")}>Go to Home</Button>
            </div>
          </FadeIn>
        </div>
      </Page>
    );
  }

  // Vouch form
  return (
    <Page>
      <div className="max-w-xl mx-auto space-y-6">
        <FadeIn>
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold font-heading">Community Endorsement</h1>
            <p className="text-[var(--color-text-muted)]">
              Someone has asked you to endorse their loan request.
            </p>
          </div>
        </FadeIn>

        {contactConsentLoading && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
            Processing your response...
          </div>
        )}

        {contactConsentResult && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            {contactConsentResult}
          </div>
        )}

        {/* Request summary */}
        <FadeIn delay={0.05}>
          <Card title="Loan Request Summary">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="p-3 bg-[var(--color-surface-warm)] rounded-xl">
                <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Category</div>
                <div className="font-medium mt-1">{endorsement.borrowRequestCategory || "—"}</div>
              </div>
              <div className="p-3 bg-[var(--color-surface-warm)] rounded-xl">
                <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Amount</div>
                <div className="font-bold mt-1">£{amountGbp}</div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-[var(--color-surface-warm)] rounded-xl">
              <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Title</div>
              <div className="font-medium mt-1">{endorsement.borrowRequestTitle || "—"}</div>
            </div>
            <div className="mt-3 rounded-xl bg-emerald-50/60 border border-emerald-200/40 p-3 text-xs text-[var(--color-text-muted)]">
              🛡️ The borrower's identity is protected. Only the loan details are shared.
            </div>
          </Card>
        </FadeIn>

        {/* Endorsement form */}
        <FadeIn delay={0.1}>
          <Card title="Your Endorsement" subtitle="Tell potential lenders why they should trust this borrower.">
            <div className="space-y-4">
              <Input
                label="Your Name"
                value={endorserName}
                onChange={(e) => setEndorserName(e.target.value)}
                placeholder="e.g., Sheikh Ahmed Ali"
              />
              <Input
                label="Title / Role"
                value={endorserTitle}
                onChange={(e) => setEndorserTitle(e.target.value)}
                placeholder="e.g., Community Elder, Imam, Teacher"
              />
              <Input
                label="Affiliation"
                value={endorserAffiliation}
                onChange={(e) => setEndorserAffiliation(e.target.value)}
                placeholder="e.g., East London Mosque"
              />
              <label className="block">
                <div className="mb-2 text-sm font-semibold">Your Vouch</div>
                <textarea
                  className="min-h-[120px] w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-[var(--color-text-subtle)]"
                  value={vouchText}
                  onChange={(e) => setVouchText(e.target.value)}
                  placeholder="How do you know this person? Why should lenders trust them?"
                />
                <div className="mt-1 text-xs text-[var(--color-text-subtle)]">{vouchText.length}/1000 characters</div>
              </label>

              {/* Contact method */}
              <div>
                <div className="mb-2 text-sm font-semibold">Your Contact Method (optional)</div>
                <p className="text-xs text-[var(--color-text-muted)] mb-3">
                  Lenders may request your contact details. You'll be asked to approve before anything is shared.
                </p>
                <div className="flex gap-4 mb-3">
                  {["email", "phone"].map((method) => (
                    <label key={method} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="contactMethod"
                        value={method}
                        checked={contactMethod === method}
                        onChange={() => setContactMethod(method)}
                        className="h-4 w-4 text-emerald-600 focus:ring-emerald-200"
                      />
                      <span className="text-sm capitalize">{method}</span>
                    </label>
                  ))}
                </div>
                <Input
                  value={contactValue}
                  onChange={(e) => setContactValue(e.target.value)}
                  placeholder={contactMethod === "email" ? "your@email.com" : "+44 7xxx xxx xxx"}
                />
              </div>

              {!isAuthed && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  You'll need to <button className="underline font-semibold" onClick={() => navigate("/login")}>log in</button> or{" "}
                  <button className="underline font-semibold" onClick={() => navigate("/register")}>create an account</button> to submit your endorsement.
                </div>
              )}

              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

              <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                {submitting ? "Submitting..." : "Submit Endorsement"}
              </Button>
            </div>
          </Card>
        </FadeIn>
      </div>
    </Page>
  );
}
