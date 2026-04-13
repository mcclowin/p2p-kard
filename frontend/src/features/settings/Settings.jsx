import React from "react";
import { useNavigate } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Input from "../../components/ui/Input.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import { useAuthStore } from "../../state/authStore.js";
import { useTheme } from "../../hooks/useTheme.js";
import { Check } from "lucide-react";
import { logoutApi } from "../../api/endpoints.js";

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { dark, toggle: toggleTheme } = useTheme();

  const [name, setName] = React.useState(user?.name || "");
  const [phone, setPhone] = React.useState(user?.phone || "");
  const [city, setCity] = React.useState(user?.city || "");
  const [postcode, setPostcode] = React.useState(user?.postcode || "");
  const [saved, setSaved] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const [notifLoanUpdates, setNotifLoanUpdates] = React.useState(true);
  const [notifNewCampaigns, setNotifNewCampaigns] = React.useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logoutApi(); } catch {}
    finally {
      logout();
      setLoggingOut(false);
      navigate("/login");
    }
  }

  return (
    <Page>
      <div className="space-y-8 max-w-2xl mx-auto">
        <FadeIn>
          <div>
            <h1 className="text-3xl font-bold font-heading">Settings</h1>
            <p className="mt-1 text-[var(--color-text-muted)]">Manage your profile and preferences.</p>
          </div>
        </FadeIn>

        {/* Success toast */}
        {saved && (
          <FadeIn>
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 text-center">
              <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" /> Changes saved successfully.</span>
            </div>
          </FadeIn>
        )}

        {/* Personal Information */}
        <FadeIn delay={0.05}>
          <Card title="Personal Information" subtitle="Your account details.">
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-lg bg-[var(--color-surface-warm)] p-4">
                  <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Email</div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-text)]">{user?.email || "—"}</div>
                </div>
                <div className="rounded-lg bg-[var(--color-surface-warm)] p-4">
                  <div className="text-xs text-[var(--color-text-subtle)] uppercase tracking-wider">Account</div>
                  <div className="mt-1 text-sm font-medium text-[var(--color-text)]">{user?.name || user?.email || "—"}</div>
                </div>
              </div>

              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
              <Input label="Phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., +44 7700 900000" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., London" />
                <Input label="Postcode" value={postcode} onChange={(e) => setPostcode(e.target.value)} placeholder="e.g., E1 6AN" />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSave}>Save Changes</Button>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Preferences */}
        <FadeIn delay={0.1}>
          <Card title="Preferences" subtitle="Appearance and notification settings.">
            <div className="space-y-5">
              {/* Dark mode */}
              <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-4">
                <div>
                  <div className="text-sm font-semibold text-[var(--color-text)]">Dark Mode</div>
                  <div className="text-xs text-[var(--color-text-muted)]">Switch between light and dark themes.</div>
                </div>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    dark ? "bg-emerald-600" : "bg-[var(--color-border)]"
                  }`}
                  aria-label="Toggle dark mode"
                >
                  <span
                    className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      dark ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>

              {/* Notification prefs */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--color-text)]">Notifications</div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifLoanUpdates}
                    onChange={(e) => setNotifLoanUpdates(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">Email me about loan updates</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifNewCampaigns}
                    onChange={(e) => setNotifNewCampaigns(e.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-200"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">Email me about new campaigns</span>
                </label>
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Account */}
        <FadeIn delay={0.15}>
          <Card title="Account" subtitle="Sign out or manage your account.">
            <div className="space-y-4">
              <Button variant="outline" onClick={handleLogout} disabled={loggingOut} className="w-full sm:w-auto">
                {loggingOut ? "Signing out..." : "Sign Out"}
              </Button>

              <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-4">
                <Button variant="outline" disabled className="opacity-50 cursor-not-allowed">
                  Delete Account
                </Button>
                <span className="text-xs text-[var(--color-text-muted)]">Contact support to delete your account.</span>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </Page>
  );
}
