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
  Medical: "medical",
  Education: "education",
  Housing: "rent",
  Employment: "other",
  Emergency: "emergency",
  Essentials: "utilities",
  Family: "other",
  Other: "other",
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

  // Page 1: Basics
  const [category, setCategory] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [city, setCity] = React.useState("");
  const [postcode, setPostcode] = React.useState("");

  // Page 2: Story
  const [whatHappened, setWhatHappened] = React.useState("");
  const [howFundsUsed, setHowFundsUsed] = React.useState("");

  // Page 3: Amount & Terms
  const [amountGbp, setAmountGbp] = React.useState("");
  const [repayDays, setRepayDays] = React.useState("");

  // Page 4: Documents
  const [files, setFiles] = React.useState([]);
  const [noDocuments, setNoDocuments] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);

  // Page 5: Verification
  const [idvStatus, setIdvStatus] = React.useState("none");
  const [bankStatus, setBankStatus] = React.useState("none");

  // Page 6: Review
  const [confirmAccurate, setConfirmAccurate] = React.useState(false);
  const [confirmTerms, setConfirmTerms] = React.useState(false);
  const [confirmReview, setConfirmReview] = React.useState(false);

  // UI
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [validationResult, setValidationResult] = React.useState(null);

  // Check verification status
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

  // Drag and drop handlers
  function onDragOver(e) { e.preventDefault(); setDragging(true); }
  function onDragLeave() { setDragging(false); }
  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (dropped.length) setFiles((prev) => [...prev, ...dropped]);
  }
  function onPickFiles(e) {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
  }
  function removeFile(idx) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  // Navigation validation
  function validateStep(s) {
    setError("");
    if (s === 1) {
      if (!category) return setError("Please select a category.");
      if (!title.trim() || title.trim().length < 10) return setError("Please add a title (at least 10 characters).");
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
      if (!Number.isFinite(days) || days < 3 || days > 180) return setError("Repayment period must be between 3 days and 6 months.");
    }
    if (s === 4) {
      if (!noDocuments && files.length === 0) return setError("Please upload at least one document, or check 'I don't have documents'.");
    }
    return true;
  }

  function goNext() {
    if (validateStep(step) !== true) return;
    setStep((s) => s + 1);
    setError("");
    setInfo("");
  }
  function goBack() { setStep((s) => s - 1); setError(""); setInfo(""); }

  // IDV
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

  // Submit
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
      none: "bg-slate-100 text-slate-600", pending: "bg-yellow-100 text-yellow-700",
      verified: "bg-emerald-100 text-emerald-700", connected: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-700", expired: "bg-orange-100 text-orange-700",
    };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.none}`}>{label}</span>;
  }

  const totalSteps = 6;

  return (
    <Page>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* Progress */}
        {step <= totalSteps && (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                <React.Fragment key={s}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition ${
                    step > s ? "bg-emerald-600 text-white" : step === s ? "bg-emerald-600 text-white ring-4 ring-emerald-200" : "bg-slate-200 text-slate-500"
                  }`}>
                    {step > s ? "✓" : s}
                  </div>
                  {s < totalSteps && <div className={`w-6 h-0.5 ${step > s ? "bg-emerald-500" : "bg-slate-200"}`} />}
                </React.Fragment>
              ))}
            </div>
            <div className="text-center text-sm text-slate-500">
              {step === 1 && "Basics"}{step === 2 && "Your Story"}{step === 3 && "Amount & Terms"}
              {step === 4 && "Documents"}{step === 5 && "Verification"}{step === 6 && "Review & Submit"}
            </div>
          </div>
        )}

        {/* Page 1: Basics */}
        {step === 1 && (
          <FadeIn>
            <Card title="What do you need help with?" subtitle="Select a category and give your request a title.">
              <div className="space-y-5">
                <div>
                  <div className="mb-3 text-sm font-semibold text-slate-800">Category</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button key={cat.key} type="button"
                        onClick={() => setCategory(cat.key)}
                        className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition ${
                          category === cat.key ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-slate-300 text-slate-600"
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
                <div className="text-xs text-slate-500">Only your area/borough will be shown publicly — never your exact address.</div>
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
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
                  <div className="mb-2 text-sm font-semibold text-slate-800">What happened?</div>
                  <textarea className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-emerald-200"
                    value={whatHappened} onChange={(e) => setWhatHappened(e.target.value)}
                    placeholder="Explain your situation — what led to this need?" />
                  <div className="mt-1 text-xs text-slate-400">{whatHappened.length}/2000 characters</div>
                </label>
                <label className="block">
                  <div className="mb-2 text-sm font-semibold text-slate-800">How will the funds be used?</div>
                  <textarea className="min-h-[100px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-emerald-200"
                    value={howFundsUsed} onChange={(e) => setHowFundsUsed(e.target.value)}
                    placeholder="What specifically will the money pay for?" />
                  <div className="mt-1 text-xs text-slate-400">{howFundsUsed.length}/500 characters</div>
                </label>
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
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
                  <div className="mb-2 text-sm font-semibold text-slate-800">Amount needed (£)</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {AMOUNT_PRESETS.map((a) => (
                      <button key={a} type="button" onClick={() => setAmountGbp(String(a))}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          amountGbp === String(a) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-slate-300"
                        }`}>£{a}</button>
                    ))}
                  </div>
                  <Input value={amountGbp} onChange={(e) => setAmountGbp(e.target.value)} inputMode="decimal" placeholder="Or enter custom amount" hint="£50 – £5,000" />
                </div>
                <div>
                  <div className="mb-2 text-sm font-semibold text-slate-800">Repay by</div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {TERM_PRESETS.map((t) => (
                      <button key={t.days} type="button" onClick={() => setRepayDays(String(t.days))}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          repayDays === String(t.days) ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-slate-200 hover:border-slate-300"
                        }`}>{t.label}</button>
                    ))}
                  </div>
                  <Input value={repayDays} onChange={(e) => setRepayDays(e.target.value)} inputMode="numeric" placeholder="Or enter days" hint="3–180 days" />
                </div>
                {amountGbp && repayDays && (
                  <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
                    You'll repay <strong>£{amountGbp}</strong> in full by <strong>{repayDays} days</strong> from approval. Zero interest.
                  </div>
                )}
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
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
                    <div
                      onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
                      className={`rounded-2xl border-2 border-dashed p-8 text-center transition cursor-pointer ${
                        dragging ? "border-emerald-500 bg-emerald-50" : "border-slate-300 hover:border-slate-400"
                      }`}
                      onClick={() => document.getElementById("file-input").click()}
                    >
                      <div className="text-3xl">📄</div>
                      <div className="mt-2 text-sm font-semibold text-slate-700">
                        Drag & drop files here, or click to browse
                      </div>
                      <div className="mt-1 text-xs text-slate-500">PDF, JPG, PNG — max 10MB each</div>
                      <input id="file-input" type="file" multiple onChange={onPickFiles} className="hidden" accept=".pdf,.jpg,.jpeg,.png" />
                    </div>
                    {files.length > 0 && (
                      <div className="space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="flex items-center justify-between rounded-xl border p-3">
                            <div className="text-sm truncate">{f.name}</div>
                            <button type="button" onClick={() => removeFile(i)} className="text-xs text-red-500 hover:text-red-700 font-semibold">Remove</button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="text-xs text-slate-500">
                      Suggested: payslip, bank statement, utility bill, medical letter, tenancy agreement, or invoice.
                    </div>
                  </>
                )}
                <label className="flex items-center gap-3 rounded-2xl border p-4 cursor-pointer hover:bg-slate-50 transition">
                  <input type="checkbox" checked={noDocuments} onChange={(e) => { setNoDocuments(e.target.checked); if (e.target.checked) setFiles([]); }}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                  <div>
                    <div className="text-sm font-semibold text-slate-800">I don't have documents right now</div>
                    <div className="text-xs text-slate-500">Your request will still be submitted but may take longer to review.</div>
                  </div>
                </label>
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
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
                <div className="p-4 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">Identity Verification</h3>
                      <p className="text-sm text-slate-600">Verify with a government ID</p>
                    </div>
                    <StatusBadge status={idvStatus} label={idvStatus === "verified" ? "Verified" : idvStatus === "pending" ? "Pending" : "Not started"} />
                  </div>
                  {idvStatus === "none" && (
                    <Button onClick={onStartIdv} disabled={loading} variant="outline" className="w-full">
                      {loading ? "Starting..." : "Start Verification"}
                    </Button>
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

                <div className="p-4 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">Link Your Bank Account</h3>
                      <p className="text-sm text-slate-600">Connect your bank to verify affordability</p>
                    </div>
                    <StatusBadge status={bankStatus} label={bankStatus === "connected" ? "Connected" : bankStatus === "pending" ? "Pending" : "Not linked"} />
                  </div>
                  {bankStatus !== "connected" && (
                    <Button onClick={onStartBankLink} disabled={loading} variant="outline" className="w-full">{loading ? "Starting..." : "Link Bank Account"}</Button>
                  )}
                  {bankStatus === "connected" && <div className="text-sm text-emerald-600 flex items-center gap-2">✓ Bank account linked</div>}
                </div>

                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                {info && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{info}</div>}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={goBack}>Back</Button>
                  <Button onClick={onContinueFromVerify} disabled={idvStatus !== "verified" || bankStatus !== "connected"}>Continue to Review</Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}

        {/* Page 6: Review & Submit */}
        {step === 6 && (
          <FadeIn>
            <Card title="Review & submit" subtitle="Please review your details before submitting.">
              <div className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase">Category</div>
                    <div className="flex items-center gap-2 mt-1"><CategoryIcon category={category} className="w-4 h-4 text-emerald-600" /><span className="font-medium">{category}</span></div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <div className="text-xs text-slate-500 uppercase">Location</div>
                    <div className="font-medium mt-1">{city}{city && postcode ? ", " : ""}{postcode}</div>
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 uppercase">Title</div><div className="font-medium mt-1">{title}</div></div>
                <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 uppercase">What happened</div><div className="text-sm text-slate-700 mt-1 line-clamp-3">{whatHappened}</div></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 uppercase">Amount</div><div className="text-lg font-semibold mt-1">£{amountGbp}</div></div>
                  <div className="p-3 bg-slate-50 rounded-xl"><div className="text-xs text-slate-500 uppercase">Repay within</div><div className="text-lg font-semibold mt-1">{repayDays} days</div></div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase">Documents</div>
                  <div className="text-sm mt-1">{noDocuments ? "None uploaded" : `${files.length} file(s)`}</div>
                </div>
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="text-xs text-emerald-600 uppercase">Verification</div>
                  <div className="flex gap-4 mt-1 text-sm">
                    <span>Identity: <strong className="text-emerald-700">Verified</strong></span>
                    <span>Bank: <strong className="text-emerald-700">Connected</strong></span>
                  </div>
                </div>

                {/* Confirmation checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={confirmAccurate} onChange={(e) => setConfirmAccurate(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                    <span className="text-sm text-slate-700">I confirm this information is accurate and truthful.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={confirmTerms} onChange={(e) => setConfirmTerms(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                    <span className="text-sm text-slate-700">I agree to the repayment terms and Qard Hasan obligations.</span>
                  </label>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={confirmReview} onChange={(e) => setConfirmReview(e.target.checked)}
                      className="mt-0.5 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200" />
                    <span className="text-sm text-slate-700">I understand my request will be reviewed and I may be asked for more information.</span>
                  </label>
                </div>

                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
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
            <Card title={validationResult?.decision === "PASS" ? "Request Approved!" : validationResult?.decision === "DECLINE" ? "Request Declined" : "Request Submitted"}
              subtitle={validationResult?.decision === "PASS" ? "Your request has been approved and is being processed." : "Your request is being reviewed by our team."}>
              <div className="space-y-4">
                <div className="flex justify-center py-6">
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
                    validationResult?.decision === "PASS" ? "bg-emerald-100" : validationResult?.decision === "DECLINE" ? "bg-red-100" : "bg-blue-100"
                  }`}>
                    <span className="text-4xl">{validationResult?.decision === "PASS" ? "✓" : validationResult?.decision === "DECLINE" ? "✗" : "⏳"}</span>
                  </div>
                </div>
                {info && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{info}</div>}
                {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-4">
                  <Button onClick={() => navigate("/app/lender")} variant="outline">View Dashboard</Button>
                  <Button onClick={() => navigate("/app/home")}>Back to Home</Button>
                </div>
              </div>
            </Card>
          </FadeIn>
        )}
      </div>
    </Page>
  );
}
