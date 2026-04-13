import React from "react";
import { Page, FadeIn } from "../../components/ui/Motion.jsx";
import Card from "../../components/ui/Card.jsx";

export default function DocsPage() {
  return (
    <Page>
      <div className="max-w-3xl mx-auto space-y-10">

        {/* ─── Header ─── */}
        <FadeIn>
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold font-heading text-[var(--color-text)]">
              How HandUp Works
            </h1>
            <p className="text-lg text-[var(--color-text-muted)]">
              Community-based, interest-free lending. Transparent, dignified, and rooted in tradition.
            </p>
          </div>
        </FadeIn>

        {/* ─── Borrower Journey ─── */}
        <FadeIn>
          <Card>
            <h2 className="text-2xl font-bold font-heading text-emerald-800 mb-2">Your Journey as a Borrower</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">From application to funds in your account</p>
            <JourneyTimeline steps={borrowerJourney} />
          </Card>
        </FadeIn>

        {/* ─── Lender Journey ─── */}
        <FadeIn>
          <Card>
            <h2 className="text-2xl font-bold font-heading text-emerald-800 mb-2">Your Journey as a Lender</h2>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">From browsing to getting repaid</p>
            <JourneyTimeline steps={lenderJourney} />
          </Card>
        </FadeIn>

        {/* ─── The Contract ─── */}
        <FadeIn>
          <Card>
            <h2 className="text-2xl font-bold font-heading text-emerald-800 mb-4">The Contract: Why It Matters</h2>
            
            <div className="bg-emerald-50/60 border border-emerald-200/40 rounded-xl p-6 mb-6">
              <p className="text-lg font-heading italic text-emerald-900 text-center leading-relaxed" dir="rtl">
                يَـٰٓأَيُّهَا ٱلَّذِينَ ءَامَنُوٓا۟ إِذَا تَدَايَنتُم بِدَيْنٍ إِلَىٰٓ أَجَلٍۢ مُّسَمًّى فَٱكْتُبُوهُ
              </p>
              <p className="text-center text-emerald-800 mt-3 font-medium">
                "O you who believe, when you contract a debt for a specified term, write it down."
              </p>
              <p className="text-center text-sm text-emerald-600 mt-1">— Quran 2:282 (Al-Baqarah)</p>
            </div>

            <div className="space-y-4 text-[var(--color-text-muted)]">
              <p>
                This is the longest verse in the Quran — an entire passage dedicated to the proper documentation of debts. 
                It instructs that loans should be written down, witnessed, and clearly specified. No ambiguity, no room for dispute.
              </p>
              <p>
                At HandUp, every funded loan generates a <strong className="text-[var(--color-text)]">Qard Hasan contract</strong> — a formal agreement between borrower and lender, with HandUp as independent witness. This isn't a formality. It's a commitment.
              </p>

              <h3 className="text-lg font-bold text-[var(--color-text)] pt-2">What the contract covers:</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Parties</strong> — borrower and lender named (both verified), HandUp as witness</li>
                <li><strong>Nature of the loan</strong> — explicitly defined as Qard Hasan (the benevolent loan — interest-free)</li>
                <li><strong>Amount</strong> — exact principal in the agreed currency</li>
                <li><strong>Zero-interest clause</strong> — prohibits interest, late fees, hidden charges, conditional benefits</li>
                <li><strong>Repayment terms</strong> — principal-only repayment by the specified date</li>
                <li><strong>Hardship & compassion</strong> — extensions encouraged, forgiveness possible, no penalties</li>
                <li><strong>Dispute resolution</strong> — good-faith discussion first, then mediation</li>
              </ul>

              <h3 className="text-lg font-bold text-[var(--color-text)] pt-2">How consent works:</h3>
              <p>
                The <strong>lender</strong> accepts the ethical lending terms before making their contribution — acknowledging that this is a goodwill loan with no interest or fees.
              </p>
              <p>
                The <strong>borrower</strong> reviews the full contract on a dedicated page and signs explicitly before funds are released — committing to repay in good faith.
              </p>
              <p>
                Both parties have access to the contract at any time through their dashboard.
              </p>
            </div>
          </Card>
        </FadeIn>

        {/* ─── T&Cs and Legal ─── */}
        <FadeIn>
          <Card>
            <h2 className="text-2xl font-bold font-heading text-emerald-800 mb-4">Terms & the Contract</h2>
            <div className="space-y-4 text-[var(--color-text-muted)]">
              <p>
                When you accept terms on HandUp, you're not just clicking through legalese. The terms flow directly into a <strong className="text-[var(--color-text)]">legally binding loan agreement</strong> — the Qard Hasan contract.
              </p>
              <p>
                The T&Cs you agree to during the application or support process become the foundation of the contract. The contract is the T&Cs made specific — with your name, the exact amount, the repayment date, and the zero-interest commitment all written down.
              </p>
              <p>
                This mirrors the Quranic instruction: don't just agree verbally — <em>write it down</em>. The contract is the written record that protects both parties and honours the tradition of transparency in financial dealings.
              </p>
              <p>
                Each contract includes a SHA-256 hash to ensure it hasn't been tampered with after signing.
              </p>
            </div>
          </Card>
        </FadeIn>

        {/* ─── FAQs ─── */}
        <FadeIn>
          <Card>
            <h2 className="text-2xl font-bold font-heading text-emerald-800 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-5">
              <FAQ q="What is Qard Hasan?" a="Qard Hasan (قرض حسن) means 'the benevolent loan.' It is an interest-free loan given as an act of goodwill. The borrower repays only the exact amount they received — nothing more. It's rooted in Islamic tradition but the concept is universal: helping someone without profiting from their hardship." />
              <FAQ q="Is this a charity? Will I get my money back?" a="HandUp is not a charity — it's a lending platform. Lenders are expected to get their money back. However, if a borrower faces genuine hardship, lenders are encouraged to grant extensions or forgive the debt. Forgiveness converts the loan into Sadaqah (charitable giving), which carries its own spiritual reward." />
              <FAQ q="Do I need to be Muslim to use HandUp?" a="No. HandUp is open to everyone. The principle of interest-free community lending is universal — it's simply the idea that you can help someone in need without profiting from their difficulty." />
              <FAQ q="How much can I borrow?" a="Between £50 and £5,000, with a repayment window of 3 days to 6 months. You can only have one active loan at a time." />
              <FAQ q="How does repayment work?" a="Single lump sum repayment by the agreed date. No monthly instalments, no interest, no fees. You'll receive reminders as the date approaches." />
              <FAQ q="What if I can't repay on time?" a="Life happens. If you're struggling, the platform facilitates communication with your lender. Lenders are encouraged to grant extensions. In the spirit of Quran 2:280: 'If the debtor is in hardship, then let there be postponement until a time of ease.'" />
              <FAQ q="Is my identity visible to lenders?" a="While browsing, your name is hidden — lenders only see your story, category, and general area (e.g. 'Hackney, London'). Your real name is only revealed in the formal contract after the loan is funded." />
              <FAQ q="What documents do I need?" a="Supporting evidence like payslips, bank statements, utility bills, or medical letters depending on your request category. There's an option to proceed without documents, but it may take longer to review." />
              <FAQ q="How is HandUp funded?" a="HandUp charges a small flat platform fee to borrowers (tiered by loan amount). We don't charge interest and we don't take a cut of the loan itself." />
              <FAQ q="Is this regulated?" a="We are currently exploring the regulatory landscape for peer-to-peer lending in the UK. We take compliance seriously and are working to ensure full adherence to applicable regulations." />
            </div>
          </Card>
        </FadeIn>

      </div>
    </Page>
  );
}

const borrowerJourney = [
  { label: "Sign up", time: "2 min", desc: "Create your account with email and password" },
  { label: "Fill in your application", time: "10 min", desc: "Tell your story, set the amount, upload documents" },
  { label: "Get endorsed", time: "5 min", desc: "Invite a trusted community member to vouch for you — builds trust with lenders" },
  { label: "Verify your identity", time: "5 min", desc: "Quick ID check and bank account link" },
  { label: "Submit", time: "1 min", desc: "Review and submit — you're done" },
  { label: "Admin review", time: "1–2 days", desc: "Our team reviews and approves your request", waiting: true },
  { label: "Campaign goes live", time: "", desc: "Your request is visible to the community" },
  { label: "A lender steps forward", time: "varies", desc: "Someone funds your loan in full", waiting: true },
  { label: "Sign the contract", time: "2 min", desc: "Review and sign the Qard Hasan agreement" },
  { label: "Funds in your account", time: "1–2 days", desc: "Money transferred to your bank", highlight: true },
];

const lenderJourney = [
  { label: "Browse campaigns", time: "", desc: "No account needed — see who needs help near you" },
  { label: "Choose someone to help", time: "2 min", desc: "Read their story, check the amount and terms" },
  { label: "Sign up or log in", time: "2 min", desc: "Create an account if you don't have one" },
  { label: "Request endorser or borrower details", time: "", desc: "Want extra confidence? Request contact details and speak to the endorser or borrower directly" },
  { label: "Fund the loan", time: "3 min", desc: "Accept the Qard Hasan terms and pay via Stripe" },
  { label: "Contract generated", time: "", desc: "A formal agreement is created between you and the borrower" },
  { label: "Borrower repays", time: "3 days – 6 months", desc: "They repay the exact amount — no interest", waiting: true },
  { label: "Money returned", time: "", desc: "Your funds come back to you", highlight: true },
];

function JourneyTimeline({ steps }) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-emerald-200" />

      <div className="space-y-0">
        {steps.map((step, i) => (
          <div key={i} className="relative flex items-start gap-4 pb-6 last:pb-0">
            {/* Dot */}
            <div className={`absolute -left-8 top-1 z-10 flex-shrink-0 w-[14px] h-[14px] rounded-full border-2 ${
              step.highlight
                ? "bg-emerald-600 border-emerald-600"
                : step.waiting
                ? "bg-white border-emerald-300 border-dashed"
                : "bg-white border-emerald-500"
            }`}>
              {step.highlight && (
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-40" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className={`font-semibold ${step.highlight ? "text-emerald-700" : "text-[var(--color-text)]"}`}>
                  {step.label}
                </span>
                {step.time && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    step.waiting
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}>
                    {step.waiting ? `~${step.time}` : step.time}
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FAQ({ q, a }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-b border-[var(--color-border)] pb-4">
      <button onClick={() => setOpen(!open)} className="w-full text-left flex justify-between items-center gap-4">
        <span className="font-semibold text-[var(--color-text)]">{q}</span>
        <span className="text-emerald-600 text-xl flex-shrink-0">{open ? "−" : "+"}</span>
      </button>
      {open && <p className="text-sm text-[var(--color-text-muted)] mt-2 pl-0">{a}</p>}
    </div>
  );
}
