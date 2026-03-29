import { Outlet } from "react-router-dom";
import Topbar from "./TopBar.jsx";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Topbar />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 pb-16 pt-8">
        <Outlet />
      </main>
      <footer className="border-t border-[var(--color-border-light)] bg-[var(--color-surface)] backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} HandUp. Community lending, zero interest.
          </div>
          <div className="flex gap-6 text-sm text-[var(--color-text-subtle)]">
            <a href="/app/the-beautiful-loan" className="hover:text-emerald-700 transition">The Beautiful Loan</a>
            <span>Built with Qard Hasan principles</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
