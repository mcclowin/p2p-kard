import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Button from "../ui/Button.jsx";
import Logo from "../ui/Logo.jsx";
import { useAuthStore } from "../../state/authStore.js";
import { logoutApi } from "../../api/endpoints.js";

function IconMenu({ className = "" }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconX({ className = "" }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronDown({ className = "" }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function NavLink({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`relative px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
        active
          ? "text-emerald-800 bg-emerald-50"
          : "text-[var(--color-text-muted)] hover:text-emerald-700 hover:bg-emerald-50/50"
      }`}
    >
      {children}
    </button>
  );
}

function Dropdown({ open, anchorRef, onClose, children, widthClass = "w-80" }) {
  const panelRef = React.useRef(null);

  const handleOutside = React.useCallback(
    (e) => {
      if (!open) return;
      const panel = panelRef.current;
      const anchor = anchorRef?.current;
      if ((panel && panel.contains(e.target)) || (anchor && anchor.contains(e.target))) return;
      onClose?.();
    },
    [open, anchorRef, onClose]
  );

  React.useEffect(() => {
    document.addEventListener("pointerdown", handleOutside);
    return () => document.removeEventListener("pointerdown", handleOutside);
  }, [handleOutside]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 6, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          className={`absolute right-0 top-full mt-2 ${widthClass} max-w-[92vw]
            rounded-xl border border-[var(--color-border)] bg-white p-3
            shadow-[var(--shadow-lg)] z-50`}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TopBar() {
  const navigate = useNavigate();
  const location = useLocation();

  const { user, isAuthed, logout } = useAuthStore();

  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [loggingOut, setLoggingOut] = React.useState(false);

  const profileAnchorRef = React.useRef(null);

  const path = location.pathname || "";

  const activeKey = path.startsWith("/app/admin")
    ? "admin"
    : path.startsWith("/app/lender")
    ? "dashboard"
    : path.startsWith("/app/borrower")
    ? "borrower"
    : path.startsWith("/app/the-beautiful-loan")
    ? "beautiful-loan"
    : "home";

  function go(to) {
    setMobileOpen(false);
    setProfileOpen(false);
    navigate(to);
  }

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try { await logoutApi(); } catch {}
    finally {
      logout();
      setLoggingOut(false);
      go("/login");
    }
  }

  const displayName = user?.name || user?.email || "Friend";
  const avatarLetter = (displayName?.[0] || "F").toUpperCase();

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--color-border-light)] bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 sm:px-6 py-3">
        {/* Brand */}
        <div
          className="cursor-pointer select-none flex items-center gap-2.5"
          onClick={() => go("/app/home")}
          title="Go to Home"
        >
          <Logo size={28} />
          <span className="text-lg font-bold tracking-tight text-emerald-800 font-heading">HandUp</span>
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          <NavLink active={activeKey === "home"} onClick={() => go("/app/home")}>Home</NavLink>
          <NavLink active={activeKey === "beautiful-loan"} onClick={() => go("/app/the-beautiful-loan")}>The Beautiful Loan</NavLink>
          {isAuthed && (
            <NavLink active={activeKey === "dashboard"} onClick={() => go("/app/lender")}>My Dashboard</NavLink>
          )}
          {isAuthed && (user?.is_staff || user?.is_superuser) && (
            <NavLink active={activeKey === "admin"} onClick={() => go("/app/admin/requests")}>Admin</NavLink>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {isAuthed ? (
            <>
              <Button
                size="sm"
                className="hidden sm:inline-flex"
                onClick={() => go("/app/borrower/apply")}
              >
                Request a Loan
              </Button>

              {/* Profile dropdown */}
              <div className="relative" ref={profileAnchorRef}>
                <button
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-white px-3 py-2 hover:bg-[var(--color-surface-warm)] transition"
                  onClick={() => setProfileOpen((v) => !v)}
                  aria-label="Profile menu"
                  type="button"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white text-sm font-semibold">
                    {avatarLetter}
                  </div>
                  <IconChevronDown className="text-[var(--color-text-muted)] hidden sm:block" />
                </button>

                <Dropdown open={profileOpen} anchorRef={profileAnchorRef} onClose={() => setProfileOpen(false)} widthClass="w-[92vw] sm:w-72">
                  <div className="px-2 pb-2">
                    <div className="text-sm font-semibold">{displayName}</div>
                    {user?.email && <div className="text-xs text-[var(--color-text-muted)]">{user.email}</div>}
                  </div>

                  <div className="mt-2 space-y-1">
                    <button className="w-full rounded-lg p-2.5 text-left text-sm hover:bg-[var(--color-surface-warm)] transition" onClick={() => go("/app/lender")} type="button">
                      My Dashboard
                    </button>
                    <button className="w-full rounded-lg p-2.5 text-left text-sm hover:bg-[var(--color-surface-warm)] transition" onClick={() => go("/app/borrower/apply")} type="button">
                      Request a Loan
                    </button>
                    {(user?.is_staff || user?.is_superuser) && (
                      <button className="w-full rounded-lg p-2.5 text-left text-sm hover:bg-[var(--color-surface-warm)] transition" onClick={() => go("/app/admin/requests")} type="button">
                        Admin Panel
                      </button>
                    )}
                  </div>

                  <div className="mt-2 border-t border-[var(--color-border-light)] pt-2">
                    <button
                      className="w-full rounded-lg p-2.5 text-left text-sm text-red-600 hover:bg-red-50 transition"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      type="button"
                    >
                      {loggingOut ? "Signing out..." : "Sign out"}
                    </button>
                  </div>
                </Dropdown>
              </div>
            </>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => go("/login")}>Sign in</Button>
              <Button size="sm" onClick={() => go("/register")}>Get started</Button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-warm)] transition"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Menu"
            type="button"
          >
            {mobileOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="md:hidden border-t border-[var(--color-border-light)] bg-white overflow-hidden"
          >
            <div className="mx-auto max-w-6xl px-4 py-4 space-y-2">
              {[
                { key: "home", label: "Home", to: "/app/home" },
                { key: "beautiful-loan", label: "The Beautiful Loan", to: "/app/the-beautiful-loan" },
              ].map((item) => (
                <button
                  key={item.key}
                  className={`w-full rounded-xl px-4 py-3 text-left text-base font-semibold transition ${
                    activeKey === item.key ? "bg-emerald-700 text-white" : "bg-[var(--color-surface-warm)] text-[var(--color-text)]"
                  }`}
                  onClick={() => go(item.to)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}

              {isAuthed ? (
                <>
                  <button
                    className={`w-full rounded-xl px-4 py-3 text-left text-base font-semibold transition ${
                      activeKey === "dashboard" ? "bg-emerald-700 text-white" : "bg-[var(--color-surface-warm)] text-[var(--color-text)]"
                    }`}
                    onClick={() => go("/app/lender")}
                    type="button"
                  >
                    My Dashboard
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button className="w-full" onClick={() => go("/app/borrower/apply")}>Request a Loan</Button>
                    <Button variant="outline" className="w-full" onClick={handleLogout} disabled={loggingOut}>
                      {loggingOut ? "..." : "Sign out"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button variant="outline" className="w-full" onClick={() => go("/login")}>Sign in</Button>
                  <Button className="w-full" onClick={() => go("/register")}>Get started</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
