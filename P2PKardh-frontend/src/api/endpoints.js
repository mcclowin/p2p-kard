import { api } from "./client";

/** =========================
 * AUTH
 * ========================= */
export async function loginApi({ email, password }) {
  const { data } = await api.post("/api/v1/auth/login", { email, password });
  return data; // { user, token } (as per your current frontend assumption)
}

export async function registerApi({ email, name, password }) {
  const { data } = await api.post("/api/v1/auth/register", {
    email,
    name,
    password,
  });
  return data; // { user, token }
}

export async function logoutApi() {
  await api.post("/api/v1/auth/logout");
}

export async function meApi() {
  const { data } = await api.get("/api/v1/me");
  return data;
}

/** =========================
 * HELPERS
 * Some serializers may return stringified JSON
 * ========================= */
function maybeParse(v) {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

/** =========================
 * HOME
 * ========================= */
export async function homeApi() {
  const { data } = await api.get("/api/v1/home");
  return {
    stats: maybeParse(data.stats),
    running_campaigns: maybeParse(data.running_campaigns),
    completed_campaigns: maybeParse(data.completed_campaigns),
  };
}

/** =========================
 * CAMPAIGNS
 * ========================= */
export async function campaignDetailApi(campaignId) {
  const { data } = await api.get(`/api/v1/campaigns/${campaignId}`);
  return data; // { campaign: {...} }
}

/** =========================
 * SUPPORT CHECKOUT (JWT required)
 * ========================= */
export async function supportCheckoutApi({
  campaignId,
  amountCents,
  currency = "GBP",
  returnUrl,
  cancelUrl,
  termsAccepted = false,
}) {
  const { data } = await api.post(
    `/api/v1/campaigns/${campaignId}/support/checkout`,
    {
      amount_cents: amountCents,
      currency,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      terms_accepted: termsAccepted,
    }
  );
  return data; // { checkout: {...} }
}

/** =========================
 * CONTRACTS (JWT required)
 * ========================= */
export async function contractDetailApi(campaignId) {
  const { data } = await api.get(`/api/v1/contracts/${campaignId}`);
  return data; // { contract: {...} }
}

export async function contractSignApi(campaignId) {
  const { data } = await api.post(`/api/v1/contracts/${campaignId}/sign`, {
    consent_confirmed: true,
  });
  return data; // { contract: {...} }
}

export async function adminContractListApi() {
  const { data } = await api.get("/api/v1/admin/contracts");
  return data; // { contracts: [...] }
}

export async function adminContractDetailApi(campaignId) {
  const { data } = await api.get(`/api/v1/admin/contracts/${campaignId}`);
  return data; // { contract: {...} }
}

/** =========================
 * DASHBOARD (JWT required)
 * ========================= */
export async function dashboardApi() {
  const { data } = await api.get("/api/v1/dashboard");
  return {
    support_summary: maybeParse(data.support_summary),
    support_by_campaign: maybeParse(data.support_by_campaign),
    borrow_requests: maybeParse(data.borrow_requests),
  };
}

/** =========================
 * BORROW REQUESTS (JWT required)
 * ========================= */
export async function createBorrowRequestApi(payload) {
  // payload uses snake_case as per your schema
  const { data } = await api.post("/api/v1/borrow-requests", payload);
  return data; // { borrow_request: {...} } OR { borrowRequest: {...} } depending on serializer mixin
}

export async function presignBorrowDocsApi(borrowRequestId, files) {
  const { data } = await api.post(
    `/api/v1/borrow-requests/${borrowRequestId}/documents/presign`,
    {
      files: files.map((f) => ({
        file_name: f.fileName,
        content_type: f.contentType,
      })),
    }
  );
  return data; // { uploads: [{document_id, upload_url, file_name, ...}] }
}

export async function confirmBorrowDocsApi(borrowRequestId, documentIds) {
  const { data } = await api.post(
    `/api/v1/borrow-requests/${borrowRequestId}/documents/confirm`,
    {
      document_ids: documentIds,
    }
  );
  return data; // { ok: true }
}

/** =========================
 * REPAYMENTS (JWT required)
 * ========================= */
export async function repaymentsMineApi() {
  const { data } = await api.get("/api/v1/repayments/mine");
  return data;
}

export async function repaymentsSetupApi({
  borrowRequestId,
  provider = "stripe",
  returnUrl,
}) {
  const { data } = await api.post("/api/v1/repayments/setup", {
    borrow_request_id: borrowRequestId,
    provider,
    return_url: returnUrl,
  });
  return data; // { setup_url }
}

export async function repaymentsPayApi({
  borrowRequestId,
  amountCents,
  currency = "GBP",
}) {
  const { data } = await api.post("/api/v1/repayments/pay", {
    borrow_request_id: borrowRequestId,
    amount_cents: amountCents,
    currency,
  });
  return data; // { checkout_url }
}

/** =========================
 * ADMIN / STAFF APIs (JWT + IsAdminUser required)
 * ========================= */

/** Borrow Requests */
// ADMIN
export async function adminBorrowRequestsApi(params = {}) {
  const { data } = await api.get("/api/v1/admin/borrow-requests", { params });
  return data;
}

export async function adminBorrowRequestDetailApi(borrowRequestId) {
  const { data } = await api.get(
    `/api/v1/admin/borrow-requests/${borrowRequestId}`
  );
  return data;
}

export async function adminBorrowDecisionApi(borrowRequestId, payload) {
  const { data } = await api.post(
    `/api/v1/admin/borrow-requests/${borrowRequestId}/decision`,
    payload
  );
  return data;
}

export async function adminCreateCampaignApi(borrowRequestId, payload) {
  const { data } = await api.post(
    `/api/v1/admin/borrow-requests/${borrowRequestId}/create-campaign`,
    payload
  );
  return data;
}

/** Campaigns (optional admin pages)
 * NOTE: These endpoints must exist in backend, otherwise you'll get 404.
 * Keeping exports prevents frontend crash.
 */
export const adminCampaignsApi = async (params = {}) => {
  const { data } = await api.get("/api/v1/admin/campaigns", { params });
  return data;
};

export const adminCampaignDetailApi = async (campaignId) => {
  const { data } = await api.get(`/api/v1/admin/campaigns/${campaignId}`);
  return data;
};

// e.g. release/disburse funds (depends on backend)
export const adminReleaseCampaignApi = async (campaignId, payload = {}) => {
  const { data } = await api.post(
    `/api/v1/admin/campaigns/${campaignId}/release`,
    payload
  );
  return data;
};

/** =========================
 * VALIDATION SERVICE APIs (Direct calls to validation microservice)
 * ========================= */

const VALIDATION_BASE = import.meta.env.VITE_VALIDATION_URL || "http://localhost:3001";

// Get user verification status (IDV, bank link, sanctions)
export async function getVerificationStatusApi(userId) {
  const res = await fetch(`${VALIDATION_BASE}/api/v1/users/${userId}/status`);
  if (!res.ok) throw new Error("Failed to get verification status");
  return res.json();
}

// Start bank linking flow - returns auth URL to redirect user
export async function startBankLinkApi(userId) {
  const res = await fetch(`${VALIDATION_BASE}/api/v1/bank/auth-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) throw new Error("Failed to start bank linking");
  return res.json(); // { authUrl }
}

// Start IDV flow - returns verification URL to redirect user
export async function startIdvSessionApi(userId, callbackUrl) {
  const res = await fetch(`${VALIDATION_BASE}/api/v1/idv/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, callbackUrl }),
  });
  if (!res.ok) throw new Error("Failed to start IDV session");
  return res.json(); // { sessionId, verificationUrl }
}

// Refresh IDV status (poll Didit for result)
export async function refreshIdvStatusApi(userId) {
  const res = await fetch(`${VALIDATION_BASE}/api/v1/idv/refresh/${userId}`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to refresh IDV status");
  return res.json(); // { idvStatus, message }
}

// Run full validation (after IDV + bank link complete)
export async function runValidationApi({ userId, amount, termMonths, purposeCategory, documents = [] }) {
  const res = await fetch(`${VALIDATION_BASE}/api/v1/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      advanceId: `draft-${Date.now()}`,
      userId,
      amount, // in pence/cents
      currency: "GBP",
      termMonths,
      purposeCategory,
      payoutMethod: "bank_transfer",
      user: {
        emailVerified: true,
        hasActiveAdvance: false,
        accountAgeDays: 30,
      },
      evidence: {
        documents, // Pass document info
        bankLinkStatus: "connected",
        idvStatus: "verified",
      },
    }),
  });
  if (!res.ok) throw new Error("Validation failed");
  return res.json();
}
