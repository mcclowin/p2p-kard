import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import CategoryIcon from "../../components/ui/CategoryIcon.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { useAuthStore } from "../../state/authStore.js";
import {
  createBorrowRequestApi,
  presignBorrowDocsApi,
  confirmBorrowDocsApi,
  getVerificationStatusApi,
  startBankLinkApi,
  startIdvSessionApi,
  refreshIdvStatusApi,
  runValidationApi,
} from "../../api/endpoints.js";

const CATEGORIES = [
  { key: "Medical", label: "Medical & Health" },
  { key: "Education", label: "Education & Training" },
  { key: "Housing", label: "Housing & Rent" },
  { key: "Employment", label: "Employment & Business" },
  { key: "Emergency", label: "Emergency & Crisis" },
  { key: "Essentials", label: "Essential Living Costs" },
  { key: "Family", label: "Family Support" },
  { key: "Other", label: "Other" },
];

const CATEGORY_MAP = {
  Medical: "medical", Education: "education", Housing: "rent", Employment: "other",
  Emergency: "emergency", Essentials: "utilities", Family: "other", Other: "other",
};

const AMOUNT_PRESETS = [100, 250, 500, 1000, 2000, 5000];
const TERM_PRESETS = [
  { label: "2 weeks", days: 14 },
  { label: "1 month", days: 30 },
  { label: "3 months", days: 90 },
  { label: "6 months", days: 180 },
];

export default function BorrowerApply() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const userId = user?.id || user?.userId || "anon";

  // Page 1
  const [category, setCategory] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [city, setCity] = React.useState("");
  const [postcode, setPostcode] = React.useState("");

  // Page 2
  const [whatHappened, setWhatHappened] = React.useState("");
  const [howFundsUsed, setHowFundsUsed] = React.useState("");

  // Page 3
  const [amountGbp, setAmountGbp] = React.useState("");
  const [repayDays, setRepayDays] = React.useState("");

  // Page 4
  const [files, setFiles] = React.useState([]);
  const [noDocuments, setNoDocuments] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  // Page 5
  const [idvStatus, setIdvStatus] = React.useState("none");
  const [bankStatus, setBankStatus] = React.useState("none");

  // Page 6
  const [confirmAccurate, setConfirmAccurate] = React.useState(false);
  const [confirmTerms, setConfirmTerms] = React.useState(false);
  const [confirmReview, setConfirmReview] = React.useState(false);

  // UI
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [validationResult, setValidationResult] = React.useState(null);

  React.useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getVerificationStatusApi(userId);
        setIdvStatus(status.idvStatus || "none");
        setBankStatus(status.bankStatus || "none");
        const idvSuccess = searchParams.get("idv_success");
        const bankSuccess = searchParams.get("bank_success");
        if (idvSuccess === "true" || bankSuccess === "true") {
          setStep(5);
          setInfo("Verification updated. Please complete all steps.");
        }
      } catch (err) {
        console.log("Could not fetch verification status:", err);
      }
    }
    checkStatus();
  }, [userId, searchParams]);

  // Drag/drop
  function onDragOver(e) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e) {
    e.preventDefault(); setDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  }
  function onPickFiles(e) { setFiles((prev) => [...prev, ...Array.from(e.target.files || [])]); }
  function removeFile(idx) { setFiles((prev) => prev.filter((_, i) => i !== idx)); }

  function validateStep(s) {
    setError("");
    if (s === 1) {
      if (!category) return setError("Please select a category.");
      if (!title.trim() || title.trim().length < 10) return setError("Title must be at least 10 characters.");
      if (!city.trim() && !postcode.trim()) return setError("Please enter your city or postcode.");
    }
    if (s === 2) {
      if (!whatHappened.trim() || whatHappened.trim().length < 100) return setError("Please explain your situation (at least 100 characters).");
      if (!howFundsUsed.trim() || howFundsUsed.trim().length < 50) return setError("Please explain how funds will be used (at least 50 characters).");
    }
    if (s === 3) {
      const gbp = Number(amountGbp);
      const days = Number(repayDays);
      if (!Number.isFinite(gbp) || gbp < 50 || gbp > 5000) return setError("Amount must be between £50 and £5,000.");
      if (!Number.isFinite(days) || days < 3 || days > 180) return setError("Repayment period: 3 days to 6 months.");
    }
    if (s === 4) {
      if (!noDocuments && files.length === 0) return setError("Upload at least one document, or check 'I don't have documents'.");
    }
    return true;
  }

  function goNext() { if (validateStep(step) !== true) return; setStep((s) => s + 1); setError(""); setInfo(""); }
  function goBack() { setStep((s) => s - 1); setError(""); setInfo(""); }

  async function onStartIdv() {
    setLoading(true); setError("");
    try {
      const callbackUrl = `${window.location.origin}/app/borrower/apply?idv_success=true`;
      const result = await startIdvSessionApi(userId, callbackUrl);
      if (result.verificationUrl) window.location.href = result.verificationUrl;
      else setError("Could not start identity verification.");
    } catch { setError("Failed to start identity verification."); }
    finally { setLoading(false); }
  }

  async function onRefreshIdvStatus() {
    setLoading(true); setError("");
    try {
      const result = await refreshIdvStatusApi(userId);
      setIdvStatus(result.idvStatus || "pending");
      if (result.idvStatus === "verified") setInfo("Identity verified!");
      else if (result.idvStatus === "failed") setError("Verification failed. Please try again.");
      else setInfo("Still in progress. Complete the verification, then check again.");
    } catch { setError("Could not check verification status."); }
    finally { setLoading(false); }
  }

  async function onStartBankLink() {
    setLoading(true); setError("");
    try {
      const result = await startBankLinkApi(userId);
      if (result.authUrl) window.location.href = result.authUrl;
      else setError("Could not start bank linking.");
    } catch { setError("Failed to start bank linking."); }
    finally { setLoading(false); }
  }

  function onContinueFromVerify() {
    if (idvStatus !== "verified") return setError("Please complete identity verification first.");
    if (bankStatus !== "connected") return setError("Please link your bank account first.");
    setError(""); setStep(6);
  }

  async function onSubmit() {
    setError(""); setInfo(""); setLoading(true);
    try {
      const gbp = Number(amountGbp);
      const days = Number(repayDays);
      const termMonths = Math.max(1, Math.round(days / 30));
      const documentInfo = files.map((f) => ({ type: "supporting_document", name: f.name, contentType: f.type || "application/octet-stream" }));

      const validation = await runValidationApi({
        userId, amount: Math.round(gbp * 100), termMonths,
        purposeCategory: CATEGORY_MAP[category] || "other", documents: documentInfo,
      });
      setValidationResult(validation);

      if (validation.decision === "DECLINE") {
        setError(`Unfortunately, your request cannot be approved. ${validation.auditEntries?.map(e => e.reasons?.join(", ")).join("; ") || "Does not meet affordability criteria."}`);
        return;
      }

      let borrowRequestId = null;
      try {
        const createRes = await createBorrowRequestApi({
          title: title.trim(), category,
          reason_detailed: `${whatHappened.trim()}\n\nFunds usage: ${howFundsUsed.trim()}`,
          amount_requested_cents: Math.round(gbp * 100),
          currency: "GBP", expected_return_days: days,
          city: city.trim(), postcode: postcode.trim(),
        });
        borrowRequestId = createRes?.borrowRequest?.id || createRes?.borrow_request?.id || createRes?.id;
      } catch (djangoErr) {
        console.error("Django API error:", djangoErr?.response?.data || djangoErr);
      }

      if (files.length && borrowRequestId) {
        try {
          const presign = await presignBorrowDocsApi(borrowRequestId, files.map((f) => ({ fileName: f.name, contentType: f.type || "application/octet-stream" })));
          const uploads = presign.uploads || [];
          const uploadedDocIds = [];
          for (let i = 0; i < uploads.length; i++) {
            const u = uploads[i]; const file = files.find((f) => f.name === u.file_name) || files[i];
            if (!u.upload_url || !u.document_id || !file) continue;
            const putRes = await fetch(u.upload_url, { method: "PUT", headers: { "Content-Type": file.type || "application/octet-stream" }, body: file });
            if (putRes.ok) uploadedDocIds.push(u.document_id);
          }
          if (uploadedDocIds.length) await confirmBorrowDocsApi(borrowRequestId, uploadedDocIds);
        } catch (uploadErr) { console.log("Upload skipped:", uploadErr); }
      }

      setStep(7);
      if (validation.decision === "PASS") setInfo("Your request has been approved! We will process it shortly.");
      else if (validation.decision === "COUNTER_OFFER" && validation.counterOffer) {
        setInfo(`Under review. We recommend £${(validation.counterOffer.suggestedAmount / 100).toFixed(0)} over ${validation.counterOffer.suggestedTermMonths} months.`);
      } else if (validation.decision === "MANUAL_REVIEW") setInfo("Your request has been submitted and is under review. We'll notify you.");
      else if (validation.decision === "NEEDS_ACTION") setInfo("Submitted. Additional actions may be required — we'll contact you.");
      else setInfo("Your request has been submitted and is being processed.");
    } catch (e) {
      console.error("Submit error:", e);
      setError(`Sorry — we couldn't process your request: ${e?.response?.data?.detail || e?.message || "Please try again."}`);
    } finally { setLoading(false); }
  }

  function StatusBadge({ status, label }) {
    const colors = {
      none: "bg-[var(--color-surface-warm)] text-[var(--color-text-muted)]",
      pending: "bg-amber-50 text-amber-700",
      verified: "bg-emerald-50 text-emerald-700",
      connected: "bg-emerald-50 text-emerald-700",
      failed: "bg-red-50 text-red-700",
      expired: "bg-orange-50 text-orange-700",
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${colors[status] || colors.none}`}>{label}</span>;
  }

  const totalSteps = 6;

  const stepLabels = ["Basics", "Your Story", "Amount & Terms", "Documents", "Verification", "Review & Submit"];

  return (
    <Page>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Progress */}
        {step <= totalSteps && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1.5">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                    step > s ? "bg-emerald-600 text-white" : step === s ? "bg-emerald-700 text-white ring-4 ring-emerald-200/60" : "bg-[var(--color-surface-warm)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
                  }`}>
                    {step > s ? "✓" : s}
                  </div>
                  {s < totalSteps && <div className={`w-8 h-0.5 ${step > s ? "bg-emerald-500" : "bg-[var(--color-border)]"}`} />}
                </React.Fragment>
              ))}
            </div>
            <div className="text-center text-sm font-medium text-[var(--color-text-muted)]">
              {stepLabels[step - 1]}
            </div>
          </div>
        )}

        {/* Page 1: Basics */}
        {step === 1 && (
          <FadeIn>
            <Card title="What do you need help with?" subtitle="Select a category and give your request a title.">
              <div className="space-y-5">
                <div>
                  <div className="mb-3 text-sm font-semibold">Category</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button key={cat.key} type="button" onClick={() => setCategory(cat.key)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all ${
                          category === cat.key ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-[var(--color-border)] hover:border-emerald-300"
                        }`}>
                        <CategoryIcon category={cat.key} className="w-6 h-6" />
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Temporary rent support" hint="10–100 characters" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Manchester" />
                  <Input label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g., M1 4BT" />
                </div>
                <div className="text-xs text-[var(--color-text-subtle)]">Only your area/borough will be shown publicly — never your exact address.</div>
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                <div className="flex justify-end"><Button onClick={goNext}>Continue</Button></div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Page 2: Story */}
        {step === 2 && (
          <FadeIn>
            <Card title="Tell us your story" subtitle="Be honest and specific. Your identity stays protected.">
              <div className="space-y-5">
                <label className="block">
                  <div className="mb-2 text-sm font-semibold">What happened?</div>
                  <textarea className="min-h-[140px] w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-[var(--color-text-subtle)]"
                    value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)}
                    placeholder="Explain your situation — what led to this need?" />
                  <div className="mt-1 text-xs text-[var(--color-text-subtle)]">{whatHappened.length}/2000 characters</div>
                </label>
                <label className="block">
                  <div className="mb-2 text-sm font-semibold">How will the funds be used?</div>
                  <textarea className="min-h-[100px] w-full rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 placeholder:text-[var(--color-text-subtle)]"
                    value={howFundsUsed} onChange={(e) => setHowFundsUsed(e.target.value)}
                    placeholder="What specifically will the money pay for?" />
                  <div className="mt-1 text-xs text-[var(--color-text-subtle)]">{howFundsUsed.length}/500 characters</div>
                </label>
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>Back</Button>
                  <Button onClick={goNext}>Continue</Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Page 3: Amount & Terms */}
        {step === 3 && (
          <FadeIn>
            <Card title="Amount & repayment" subtitle="Choose how much you need and when you'll repay.">
              <div className="space-y-5">
                <div>
                  <div className="mb-2 text-sm font-semibold">Amount needed (£)</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {AMOUNT_PRESETS.map((a) => (
                      <button key={a} type="button" onClick={() => setAmountGbp(String(a))}
                        className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                          amountGbp === String(a) ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-[var(--color-border)] hover:border-emerald-300"
                        }`}>£{a}</button>
                    ))}
                  </div>
                  <Input value={amountGbp} onChange={(e) => setAmountGbp(e.target.value)} inputMode="decimal" placeholder="Or enter custom amount" hint="£50 – £5,000" />
                </div>
                <div>
                  <div className="mb-2 text-sm font-semibold">Repay by</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {TERM_PRESETS.map((t) => (
                      <button key={t.days} type="button" onClick={() => setRepayDays(String(t.days))}
                        className={`rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all ${
                          repayDays === String(t.days) ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-[var(--color-border)] hover:border-emerald-300"
                        }`}>{t.label}</button>
                    ))}
                  </div>
                  <Input value={repayDays} onChange={(e) => setRepayDays(e.target.value)} inputMode="numeric" placeholder="Or enter days" hint="3–180 days" />
                </div>
                {amountGbp && repayDays && (
                  <div className="rounded-xl bg-emerald-50/80 border border-emerald-200/60 p-4 text-sm text-emerald-800">
                    You'll repay <strong>£{amountGbp}</strong> in full within <strong>{repayDays} days</strong>. Zero interest.
                  </div>
                )}
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>Back</Button>
                  <Button onClick={goNext}>Continue</Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Page 4: Documents */}
        {step === 4 && (
          <FadeIn>
            <Card title="Supporting documents" subtitle="Upload evidence to strengthen your request.">
              <div className="space-y-5">
                {!noDocuments && (
                  <>
                    <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                      className={`rounded-xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                        dragging ? "border-emerald-500 bg-emerald-50" : "border-[var(--color-border)] hover:border-emerald-300"
                      }`}
                      onClick={() => document.getElementById("file-input").click()}>
                      <div className="text-3xl">📄</div>
                      <div className="mt-2 text-sm font-semibold">Drag & drop files here, or click to browse</div>
                      <div className="mt-1 text-xs text-[var(--color-text-subtle)]">PDF, JPG, PNG — max 10MB each</div>
                      <input id="file-input" type="file" multiple onChange={onPickFiles} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
                            <div className="text-sm truncate">{f.name}</div>
                            <button type="button" onClick={() => removeFile(i)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-[var(--color-text-subtle)]">
                      Suggested: payslip, bank statement, utility bill, medical letter, tenancy agreement, or invoice.
                    </div>
                  </>
                )}
                <label className="flex items-center gap-3 rounded-xl border-2 border-[var(--color-border)] p-4 cursor-pointer hover:border-emerald-300 transition">
                  <input type="checkbox" checked={noDocuments} onChange={(e) => { setNoDocuments(e.target.checked); if (e.target.checked) setFiles([]); }}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                  <div>
                    <div className="text-sm font-semibold">I don't have documents right now</div>
                    <div className="text-xs text-[var(--color-text-muted)]">Your request will still be submitted but may take longer to review.</div>
                  </div>
                </label>
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>Back</Button>
                  <Button onClick={goNext}>Continue</Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Page 5: Verification */}
        {step === 5 && (
          <FadeIn>
            <Card title="Verify your identity" subtitle="To protect our community, we verify identity and financial situation.">
              <div className="space-y-6">
                <div className="p-5 border-2 border-[var(--color-border)] rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold font-heading">Identity Verification</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">Verify with a government ID</p>
                    </div>
                    <StatusBadge status={idvStatus} label={idvStatus === "verified" ? "Verified" : idvStatus === "pending" ? "Pending" : "Not started"} />
                  </div>
                  {idvStatus === "none" && (
                    <Button onClick={onStartIdv} disabled={loading} variant="outline" className="w-full">{loading ? "Starting..." : "Start Verification"}</Button>
                  )}
                  {idvStatus === "pending" && (
                    <div className="flex gap-2">
                      <Button onClick={onStartIdv} disabled={loading} variant="outline" className="flex-1">{loading ? "..." : "Open Verification"}</Button>
                      <Button onClick={onRefreshIdvStatus} disabled={loading} className="flex-1">{loading ? "Checking..." : "Check Status"}</Button>
                    </div>
                  )}
                  {idvStatus === "verified" && <div className="text-sm text-emerald-600 flex items-center gap-2">✓ Identity verified</div>}
                  {idvStatus === "failed" && (
                    <><p className="text-sm text-red-600 mb-2">Verification failed.</p><Button onClick={onStartIdv} disabled={loading} variant="outline" className="w-full">Retry</Button></>
                  )}
                </div>

                <div className="p-5 border-2 border-[var(--color-border)] rounded-xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold font-heading">Link Your Bank Account</h3>
                      <p className="text-sm text-[var(--color-text-muted)]">Connect your bank to verify affordability</p>
                    </div>
                    <StatusBadge status={bankStatus} label={bankStatus === "connected" ? "Connected" : bankStatus === "pending" ? "Pending" : "Not linked"} />
                  </div>
                  {bankStatus !== "connected" && (
                    <Button onClick={onStartBankLink} disabled={loading} variant="outline" className="w-full">{loading ? "Starting..." : "Link Bank Account"}</Button>
                  )}
                  {bankStatus === "connected" && <div className="text-sm text-emerald-600 flex items-center gap-2">✓ Bank account linked</div>}
                </div>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                {info && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{info}</div>}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>Back</Button>
                  <Button onClick={onContinueFromVerify} disabled={idvStatus !== "verified" || bankStatus !== "connected"}>Continue to Review</Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Page 6: Review */}
        {step === 6 && (
          <FadeIn>
            <Card title="Review & submit" subtitle="Please review your details before submitting.">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-4 bg-[var(--color-surface-warm)] rounded-xl">
                    <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Category</div>
                    <div className="flex items-center gap-2 mt-1.5"><CategoryIcon category={category} className="w-4 h-4 text-emerald-600" /><span className="font-medium">{category}</span></div>
                  </div>
                  <div className="p-4 bg-[var(--color-surface-warm)] rounded-xl">
                    <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Location</div>
                    <div className="font-medium mt-1.5">{city}{city && postcode ? ", " : ""}{postcode}</div>
                  </div>
                </div>
                <div className="p-4 bg-[var(--color-surface-warm)] rounded-xl">
                  <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Title</div>
                  <div className="font-medium mt-1.5">{title}</div>
                </div>
                <div className="p-4 bg-[var(--color-surface-warm)] rounded-xl">
                  <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">What happened</div>
                  <div className="text-sm text-[var(--color-text-muted)] mt-1.5 line-clamp-3">{whatHappened}</div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-4 bg-[var(--color-surface-warm)] rounded-xl">
                    <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Amount</div>
                    <div className="text-xl font-bold font-heading mt-1.5">£{amountGbp}</div>
                  </div>
                  <div className="p-4 bg-[var(--color-surface-warm)] rounded-xl">
                    <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Repay within</div>
                    <div className="text-xl font-bold font-heading mt-1.5">{repayDays} days</div>
                  </div>
                </div>
                <div className="p-4 bg-[var(--color-surface-warm)] rounded-xl">
                  <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Documents</div>
                  <div className="text-sm mt-1.5">{noDocuments ? "None uploaded" : `${files.length} file(s)`}</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200/60">
                  <div className="text-xs text-emerald-600 uppercase tracking-wider">Verification</div>
                  <div className="flex gap-4 mt-1.5 text-sm">
                    <span>Identity: <strong className="text-emerald-700">Verified</strong></span>
                    <span>Bank: <strong className="text-emerald-700">Connected</strong></span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  {[
                    { checked: confirmAccurate, set: setConfirmAccurate, text: "I confirm this information is accurate and truthful." },
                    { checked: confirmTerms, set: setConfirmTerms, text: "I agree to the repayment terms and Qard Hasan obligations." },
                    { checked: confirmReview, set: setConfirmReview, text: "I understand my request will be reviewed and I may be asked for more information." },
                  ].map((item, i) => (
                    <label key={i} className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" checked={item.checked} onChange={(e) => item.set(e.target.checked)}
                        className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                      <span className="text-sm text-[var(--color-text-muted)]">{item.text}</span>
                    </label>
                  ))}
                </div>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={goBack}>Back</Button>
                  <Button onClick={onSubmit} disabled={loading || !confirmAccurate || !confirmTerms || !confirmReview}>
                    {loading ? "Submitting..." : "Submit for Review"}
                  </Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Page 7: Success */}
        {step === 7 && (
          <FadeIn>
            <div className="text-center space-y-6 py-8">
              <div className={`inline-flex w-20 h-20 rounded-full items-center justify-center text-4xl ${
                validationResult?.decision === "PASS" ? "bg-emerald-100" : validationResult?.decision === "DECLINE" ? "bg-red-100" : "bg-blue-100"
              }`}>
                {validationResult?.decision === "PASS" ? "✓" : validationResult?.decision === "DECLINE" ? "✗" : "⏳"}
              </div>
              <h2 className="text-2xl font-bold font-heading">
                {validationResult?.decision === "PASS" ? "Request Approved!" : validationResult?.decision === "DECLINE" ? "Request Declined" : "Request Submitted"}
              </h2>
              <p className="text-[var(--color-text-muted)] max-w-md mx-auto">
                {validationResult?.decision === "PASS" ? "Your request has been approved and is being processed." : "Your request is being reviewed by our team."}
              </p>
              {info && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 max-w-md mx-auto">{info}</div>}
              {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 max-w-md mx-auto">{error}</div>}
              <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                <Button variant="outline" onClick={() => navigate("/app/borrower")}>View Dashboard</Button>
                <Button onClick={() => navigate("/app/home")}>Back to Home</Button>
              </div>
            </div>
          </FadeIn>
        )}
      </div>
    </Page>
  );
}
