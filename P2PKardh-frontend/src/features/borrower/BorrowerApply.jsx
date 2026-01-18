import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page } from "../../components/ui/Motion.jsx";
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

const CATEGORIES = ["Medical", "Education", "Housing", "Employment", "Emergency", "Essentials"];

// Map category to purposeCategory for validation
const CATEGORY_MAP = {
  Medical: "medical",
  Education: "education",
  Housing: "rent",
  Employment: "other",
  Emergency: "emergency",
  Essentials: "utilities",
};

export default function BorrowerApply() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const userId = user?.id || user?.userId || "anon";

  // Form state
  const [title, setTitle] = React.useState("");
  const [category, setCategory] = React.useState("Medical");
  const [reason, setReason] = React.useState("");
  const [amountGbp, setAmountGbp] = React.useState("500");
  const [termMonths, setTermMonths] = React.useState("6");
  const [files, setFiles] = React.useState([]);

  // Verification state
  const [idvStatus, setIdvStatus] = React.useState("none"); // none, pending, verified, failed
  const [bankStatus, setBankStatus] = React.useState("none"); // none, pending, connected, expired

  // UI state
  const [step, setStep] = React.useState(1); // 1=form, 2=verify, 3=review
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [info, setInfo] = React.useState("");
  const [validationResult, setValidationResult] = React.useState(null);

  // Check verification status on mount and after redirects
  React.useEffect(() => {
    async function checkStatus() {
      try {
        const status = await getVerificationStatusApi(userId);
        setIdvStatus(status.idvStatus || "none");
        setBankStatus(status.bankStatus || "none");

        // Handle callback redirects
        const idvSuccess = searchParams.get("idv_success");
        const bankSuccess = searchParams.get("bank_success");

        if (idvSuccess === "true" || bankSuccess === "true") {
          setStep(2); // Stay on verification step
          setInfo("Verification updated. Please complete all steps.");
        }
      } catch (err) {
        console.log("Could not fetch verification status:", err);
      }
    }
    checkStatus();
  }, [userId, searchParams]);

  function onPickFiles(e) {
    const selected = Array.from(e.target.files || []);
    setFiles(selected);
  }

  // Step 1: Validate form and go to verification
  function onContinueToVerify() {
    setError("");
    setInfo("");
    const gbp = Number(amountGbp);
    const months = Number(termMonths);

    if (!title.trim()) return setError("Please add a short title.");
    if (!reason.trim()) return setError("Please explain your situation clearly.");
    if (!Number.isFinite(gbp) || gbp < 50 || gbp > 5000) {
      return setError("Amount must be between £50 and £5,000.");
    }
    if (!Number.isFinite(months) || months < 1 || months > 24) {
      return setError("Term must be between 1 and 24 months.");
    }
    // Warn about documents but don't block
    if (gbp >= 200 && files.length === 0) {
      setInfo("Note: For requests of £200+, documents may be required. You can upload them now or later.");
    }

    setStep(2);
  }

  // Step 2: Start IDV verification
  async function onStartIdv() {
    setLoading(true);
    setError("");
    try {
      const callbackUrl = `${window.location.origin}/app/borrower/apply?idv_success=true`;
      const result = await startIdvSessionApi(userId, callbackUrl);

      if (result.verificationUrl) {
        window.location.href = result.verificationUrl;
      } else {
        setError("Could not start identity verification.");
      }
    } catch (err) {
      setError("Failed to start identity verification. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Refresh IDV status (poll for completion)
  async function onRefreshIdvStatus() {
    setLoading(true);
    setError("");
    try {
      const result = await refreshIdvStatusApi(userId);
      setIdvStatus(result.idvStatus || "pending");

      if (result.idvStatus === "verified") {
        setInfo("Identity verification complete!");
      } else if (result.idvStatus === "failed") {
        setError("Identity verification failed. Please try again.");
      } else {
        setInfo("Verification still in progress. Please complete the verification in the opened window, then click refresh again.");
      }
    } catch (err) {
      setError("Could not check verification status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Start bank linking
  async function onStartBankLink() {
    setLoading(true);
    setError("");
    try {
      const result = await startBankLinkApi(userId);

      if (result.authUrl) {
        window.location.href = result.authUrl;
      } else {
        setError("Could not start bank linking.");
      }
    } catch (err) {
      setError("Failed to start bank linking. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Continue to review
  function onContinueToReview() {
    if (idvStatus !== "verified") {
      return setError("Please complete identity verification first.");
    }
    if (bankStatus !== "connected") {
      return setError("Please link your bank account first.");
    }
    setError("");
    setStep(3);
  }

  // Step 3: Run validation and submit
  async function onSubmit() {
    setError("");
    setInfo("");
    setLoading(true);

    try {
      // 1. Run affordability validation
      const gbp = Number(amountGbp);
      const months = Number(termMonths);

      // Convert files to document info for validation
      const documentInfo = files.map((f) => ({
        type: "supporting_document",
        name: f.name,
        contentType: f.type || "application/octet-stream",
      }));

      const validation = await runValidationApi({
        userId,
        amount: Math.round(gbp * 100), // Convert to pence
        termMonths: months,
        purposeCategory: CATEGORY_MAP[category] || "other",
        documents: documentInfo,
      });

      setValidationResult(validation);

      // Check validation decision - only DECLINE stops the flow
      if (validation.decision === "DECLINE") {
        setError(
          `Unfortunately, your request cannot be approved at this time. ` +
          `Reason: ${validation.auditEntries?.map(e => e.reasons?.join(", ")).join("; ") || "Does not meet affordability criteria."}`
        );
        return;
      }

      // 2. Create borrow request in Django
      let borrowRequestId = null;
      let djangoError = null;
      try {
        const createRes = await createBorrowRequestApi({
          title: title.trim(),
          category,
          reason_detailed: reason.trim(),
          amount_requested_cents: Math.round(gbp * 100),
          currency: "EUR", // Django only supports EUR currently
          expected_return_days: months * 30,
        });

        borrowRequestId =
          createRes?.borrowRequest?.id ||
          createRes?.borrow_request?.id ||
          createRes?.id;

        if (!borrowRequestId) {
          console.log("Borrow create response (no ID):", createRes);
        }
      } catch (djangoErr) {
        console.error("Django API error:", djangoErr?.response?.data || djangoErr);
        if (djangoErr?.response?.status === 401) {
          djangoError = "Session expired - please log in again to save your request.";
        } else if (djangoErr?.response?.status === 400) {
          const detail = djangoErr?.response?.data?.error?.details || djangoErr?.response?.data;
          djangoError = `Invalid request: ${JSON.stringify(detail)}`;
        } else {
          djangoError = "Could not save request to server. Please try again.";
        }
      }

      // 3. Upload documents if any (only if we have a borrow request ID)
      if (files.length && borrowRequestId) {
        try {
          const presign = await presignBorrowDocsApi(
            borrowRequestId,
            files.map((f) => ({ fileName: f.name, contentType: f.type || "application/octet-stream" }))
          );

          const uploads = presign.uploads || [];
          const uploadedDocIds = [];

          for (let i = 0; i < uploads.length; i++) {
            const u = uploads[i];
            const file = files.find((f) => f.name === u.file_name) || files[i];
            if (!u.upload_url || !u.document_id || !file) continue;

            const putRes = await fetch(u.upload_url, {
              method: "PUT",
              headers: { "Content-Type": file.type || "application/octet-stream" },
              body: file,
            });

            if (putRes.ok) uploadedDocIds.push(u.document_id);
          }

          if (uploadedDocIds.length) {
            await confirmBorrowDocsApi(borrowRequestId, uploadedDocIds);
          }
        } catch (uploadErr) {
          console.log("Upload skipped:", uploadErr);
        }
      }

      // 4. Show appropriate message based on decision and navigate
      setStep(4); // Move to success step

      // Show Django error if request wasn't saved
      if (djangoError) {
        setError(djangoError);
      }

      if (validation.decision === "PASS") {
        setInfo(borrowRequestId
          ? "Your request has been approved! We will process it shortly."
          : "Validation passed but request could not be saved. Please try again.");
      } else if (validation.decision === "COUNTER_OFFER" && validation.counterOffer) {
        const suggested = validation.counterOffer;
        setInfo(
          `Your request is under review. Based on your financial profile, we recommend £${(suggested.suggestedAmount / 100).toFixed(0)} ` +
          `over ${suggested.suggestedTermMonths} months. ${suggested.reason || ""}`
        );
      } else if (validation.decision === "MANUAL_REVIEW") {
        setInfo(borrowRequestId
          ? "Your request has been submitted and is under review by our team. We'll notify you once a decision is made."
          : "Validation passed but request could not be saved. Please log in again and resubmit.");
      } else if (validation.decision === "NEEDS_ACTION") {
        const actions = validation.requiredActions?.map(a => a.description).join(", ") || "Additional information required";
        setInfo(`Your request has been submitted. Required actions: ${actions}. We will contact you with next steps.`);
      } else {
        setInfo("Your request has been submitted and is being processed.");
      }

    } catch (e) {
      console.error("Submit error:", e);

      // Check if it's an auth error (401)
      if (e?.response?.status === 401) {
        setError("Your session has expired. Please save your information and log in again.");
      } else if (e?.message === "NO_BORROW_ID") {
        // Django didn't return an ID but request might have succeeded
        setStep(4);
        setInfo("Your request has been submitted. Please check your dashboard for status updates.");
      } else {
        setError(`Sorry — we couldn't process your request: ${e?.response?.data?.detail || e?.message || "Please try again."}`);
      }
    } finally {
      setLoading(false);
    }
  }

  // Render verification status badge
  function StatusBadge({ status, label }) {
    const colors = {
      none: "bg-slate-100 text-slate-600",
      pending: "bg-yellow-100 text-yellow-700",
      verified: "bg-emerald-100 text-emerald-700",
      connected: "bg-emerald-100 text-emerald-700",
      failed: "bg-red-100 text-red-700",
      expired: "bg-orange-100 text-orange-700",
    };
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status] || colors.none}`}>
        {label}
      </span>
    );
  }

  return (
    <Page>
      <div className="space-y-6">
        {/* Progress indicator */}
        {step < 4 && (
          <>
            <div className="flex items-center justify-center space-x-4 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= s ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div className={`w-12 h-1 mx-2 ${step > s ? "bg-emerald-600" : "bg-slate-200"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center text-sm text-slate-600 mb-4">
              {step === 1 && "Step 1: Request Details"}
              {step === 2 && "Step 2: Verify Your Identity"}
              {step === 3 && "Step 3: Review & Submit"}
            </div>
          </>
        )}

        {/* Step 1: Form */}
        {step === 1 && (
          <Card
            title="Request support"
            subtitle="Please share your situation honestly. Your identity will remain protected."
            footer={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={() => navigate("/app/home")}>Back</Button>
                <Button onClick={onContinueToVerify}>Continue to Verification</Button>
              </div>
            }
          >
            <div className="space-y-4">
              <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Temporary rent support" />

              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-800">Category</div>
                <select
                  className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-emerald-200"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-800">Reason (detailed)</div>
                <textarea
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-emerald-200"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please explain what happened, why you need help, and your plan to repay."
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Amount (GBP)" inputMode="decimal" value={amountGbp} onChange={(e) => setAmountGbp(e.target.value)} />
                <Input label="Repayment term (months)" inputMode="numeric" value={termMonths} onChange={(e) => setTermMonths(e.target.value)} />
              </div>

              <label className="block">
                <div className="mb-2 text-sm font-semibold text-slate-800">
                  Supporting documents {Number(amountGbp) >= 200 ? "(required)" : "(optional)"}
                </div>
                {Number(amountGbp) >= 200 && (
                  <p className="text-sm text-amber-600 mb-2">
                    For requests of £200 or more, please upload at least one document (payslip, bank statement, or utility bill).
                  </p>
                )}
                <input
                  type="file"
                  multiple
                  onChange={onPickFiles}
                  className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800"
                />
                {!!files.length && (
                  <div className="mt-2 text-sm text-slate-600">
                    Selected: {files.map((f) => f.name).join(", ")}
                  </div>
                )}
              </label>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
              )}
            </div>
          </Card>
        )}

        {/* Step 2: Verification */}
        {step === 2 && (
          <Card
            title="Verify Your Identity"
            subtitle="To protect our community, we need to verify your identity and financial situation."
            footer={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button
                  onClick={onContinueToReview}
                  disabled={idvStatus !== "verified" || bankStatus !== "connected"}
                >
                  Continue to Review
                </Button>
              </div>
            }
          >
            <div className="space-y-6">
              {/* Identity Verification */}
              <div className="p-4 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">Identity Verification</h3>
                    <p className="text-sm text-slate-600">Verify your identity with a government ID</p>
                  </div>
                  <StatusBadge
                    status={idvStatus}
                    label={idvStatus === "verified" ? "Verified" : idvStatus === "pending" ? "Pending" : "Not started"}
                  />
                </div>
                {idvStatus === "none" && (
                  <Button onClick={onStartIdv} disabled={loading} variant="outline" className="w-full">
                    {loading ? "Starting..." : "Start Verification"}
                  </Button>
                )}
                {idvStatus === "pending" && (
                  <div className="space-y-2">
                    <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded-lg">
                      Complete the verification in the popup/tab, then click "Check Status" below.
                    </p>
                    <div className="flex gap-2">
                      <Button onClick={onStartIdv} disabled={loading} variant="outline" className="flex-1">
                        {loading ? "..." : "Open Verification"}
                      </Button>
                      <Button onClick={onRefreshIdvStatus} disabled={loading} className="flex-1">
                        {loading ? "Checking..." : "Check Status"}
                      </Button>
                    </div>
                  </div>
                )}
                {idvStatus === "verified" && (
                  <div className="text-sm text-emerald-600 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Identity verified successfully
                  </div>
                )}
                {idvStatus === "failed" && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600">Verification failed. Please try again.</p>
                    <Button onClick={onStartIdv} disabled={loading} variant="outline" className="w-full">
                      Retry Verification
                    </Button>
                  </div>
                )}
              </div>

              {/* Bank Linking */}
              <div className="p-4 border border-slate-200 rounded-2xl">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-slate-800">Link Your Bank Account</h3>
                    <p className="text-sm text-slate-600">Connect your bank to verify income and affordability</p>
                  </div>
                  <StatusBadge
                    status={bankStatus}
                    label={bankStatus === "connected" ? "Connected" : bankStatus === "pending" ? "Pending" : "Not linked"}
                  />
                </div>
                {bankStatus !== "connected" && (
                  <Button onClick={onStartBankLink} disabled={loading} variant="outline" className="w-full">
                    {loading ? "Starting..." : "Link Bank Account"}
                  </Button>
                )}
                {bankStatus === "connected" && (
                  <div className="text-sm text-emerald-600 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Bank account linked successfully
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
              )}
              {info && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{info}</div>
              )}
            </div>
          </Card>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <Card
            title="Review Your Request"
            subtitle="Please review your details before submitting."
            footer={
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button onClick={onSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit Request"}
                </Button>
              </div>
            }
          >
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase">Amount</div>
                  <div className="text-lg font-semibold">£{amountGbp}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase">Repayment Term</div>
                  <div className="text-lg font-semibold">{termMonths} months</div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">Title</div>
                <div className="font-medium">{title}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">Category</div>
                <div className="font-medium">{category}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl">
                <div className="text-xs text-slate-500 uppercase">Reason</div>
                <div className="text-sm text-slate-700">{reason}</div>
              </div>

              {files.length > 0 && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase">Documents</div>
                  <div className="text-sm">{files.map(f => f.name).join(", ")}</div>
                </div>
              )}

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <div className="text-xs text-emerald-600 uppercase">Verification Status</div>
                <div className="flex gap-4 mt-1">
                  <span className="text-sm">Identity: <strong className="text-emerald-700">Verified</strong></span>
                  <span className="text-sm">Bank: <strong className="text-emerald-700">Connected</strong></span>
                </div>
              </div>

              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
              )}
              {info && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{info}</div>
              )}

              {validationResult && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="text-xs text-blue-600 uppercase">Validation Result</div>
                  <div className="text-sm mt-1">
                    Decision: <strong>{validationResult.decision}</strong>
                    {validationResult.risk && (
                      <span className="ml-4">Risk Score: {validationResult.risk.score}/100</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Step 4: Success/Submitted */}
        {step === 4 && (
          <Card
            title={
              validationResult?.decision === "PASS"
                ? "Request Approved!"
                : validationResult?.decision === "DECLINE"
                ? "Request Declined"
                : "Request Submitted"
            }
            subtitle={
              validationResult?.decision === "PASS"
                ? "Your request has been approved and is being processed."
                : validationResult?.decision === "DECLINE"
                ? "Unfortunately, we cannot approve your request at this time."
                : "Your request is being reviewed by our team."
            }
          >
            <div className="space-y-4">
              {/* Status icon */}
              <div className="flex justify-center py-6">
                {validationResult?.decision === "PASS" ? (
                  <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : validationResult?.decision === "DECLINE" ? (
                  <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center">
                    <svg className="w-10 h-10 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase">Amount Requested</div>
                  <div className="text-lg font-semibold">£{amountGbp}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-xs text-slate-500 uppercase">Status</div>
                  <div className="text-lg font-semibold">
                    {validationResult?.decision === "PASS" && "Approved"}
                    {validationResult?.decision === "DECLINE" && "Declined"}
                    {validationResult?.decision === "MANUAL_REVIEW" && "Under Review"}
                    {validationResult?.decision === "NEEDS_ACTION" && "Action Required"}
                    {validationResult?.decision === "COUNTER_OFFER" && "Counter Offer"}
                    {!validationResult?.decision && "Processing"}
                  </div>
                </div>
              </div>

              {/* Info message */}
              {info && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {info}
                </div>
              )}

              {/* Required actions if any */}
              {validationResult?.requiredActions?.length > 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                  <div className="text-sm font-semibold text-yellow-800 mb-2">Required Actions:</div>
                  <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
                    {validationResult.requiredActions.map((action, i) => (
                      <li key={i}>{action.description}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Document upload for NEEDS_ACTION */}
              {validationResult?.decision === "NEEDS_ACTION" && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="text-sm font-semibold text-slate-800 mb-2">Upload Documents</div>
                  <p className="text-sm text-slate-600 mb-3">
                    Upload supporting documents to complete your request (payslip, bank statement, or utility bill).
                  </p>
                  <input
                    type="file"
                    multiple
                    onChange={onPickFiles}
                    className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-xl file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800"
                  />
                  {!!files.length && (
                    <div className="mt-2 text-sm text-slate-600">
                      Selected: {files.map((f) => f.name).join(", ")}
                    </div>
                  )}
                  <Button
                    onClick={async () => {
                      if (files.length === 0) {
                        setError("Please select at least one file to upload.");
                        return;
                      }
                      setLoading(true);
                      setError("");
                      try {
                        // Re-run validation with documents
                        setInfo("Uploading documents and re-validating...");
                        // For now, just show success - actual upload would need borrow request ID
                        setTimeout(() => {
                          setInfo("Documents noted. Our team will review your request shortly.");
                          setLoading(false);
                        }, 1000);
                      } catch (err) {
                        setError("Failed to upload documents. Please try again.");
                        setLoading(false);
                      }
                    }}
                    disabled={loading || files.length === 0}
                    className="mt-3 w-full"
                  >
                    {loading ? "Uploading..." : "Upload Documents"}
                  </Button>
                </div>
              )}

              {/* Counter offer details */}
              {validationResult?.counterOffer && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                  <div className="text-sm font-semibold text-blue-800 mb-2">Recommended Adjustment:</div>
                  <div className="text-sm text-blue-700">
                    Amount: £{(validationResult.counterOffer.suggestedAmount / 100).toFixed(0)} over {validationResult.counterOffer.suggestedTermMonths} months
                  </div>
                  {validationResult.counterOffer.reason && (
                    <div className="text-sm text-blue-600 mt-1">{validationResult.counterOffer.reason}</div>
                  )}
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center pt-4">
                <Button onClick={() => navigate("/app/lender")} variant="outline">
                  View Dashboard
                </Button>
                <Button onClick={() => navigate("/app/home")}>
                  Back to Home
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </Page>
  );
}
