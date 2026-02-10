import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import Card from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import { Page } from "../../components/ui/Motion.jsx";

export default function QardHasanContract() {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Page>
      <div className="space-y-6 max-w-3xl mx-auto">
        <Card
          title="Qard Hasan Agreement"
          subtitle="Interest-free loan contract"
          footer={
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
              <Button disabled>Sign Agreement</Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
              <h3 className="font-semibold text-emerald-800">بسم الله الرحمن الرحيم</h3>
              <p className="mt-2 text-sm text-slate-600">
                This Qard Hasan (Benevolent Loan) agreement is entered into as an interest-free
                goodwill loan, rooted in the Islamic tradition of benevolent lending, open to all
                regardless of faith.
              </p>
            </div>

            <div className="rounded-2xl border p-5 space-y-3">
              <h4 className="font-semibold text-slate-800">Key Terms</h4>
              <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
                <li><strong>Nature:</strong> This is a Qard Hasan — an interest-free goodwill loan.</li>
                <li><strong>Zero Interest:</strong> No interest, late fees, hidden charges, or conditional benefits shall apply.</li>
                <li><strong>Repayment:</strong> The borrower shall repay the principal amount only, by the agreed date.</li>
                <li><strong>Hardship:</strong> If the borrower faces genuine hardship, extensions are encouraged. Forgiveness is an act of virtue.</li>
                <li><strong>Platform Role:</strong> HandUp acts as facilitator and witness, not a party to the loan.</li>
                <li><strong>Dispute Resolution:</strong> Good-faith discussion first, then mediation, then applicable law.</li>
              </ul>
            </div>

            <div className="text-xs text-slate-500">
              Contract ID: {id || "—"} • This contract will be auto-generated when a campaign is fully funded.
              The borrower must sign before funds are released.
            </div>
          </div>
        </Card>
      </div>
    </Page>
  );
}
