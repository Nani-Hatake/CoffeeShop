import { useEffect, useState } from "react";

import AdminShell, { Section, StatCard } from "../../../components/admin/AdminShell.jsx";
import { ownerApi } from "../../../api";
import { useToast } from "../../../contexts/ToastContext.jsx";

const EMPTY_EXPENSE = { category: "rent", description: "", vendor: "", amount: 0 };

export default function Finance() {
  const [pnl, setPnl] = useState(null);
  const [days, setDays] = useState(30);
  const [expenses, setExpenses] = useState([]);
  const [tax, setTax] = useState(null);
  const [taxForm, setTaxForm] = useState(null);
  const [expenseForm, setExpenseForm] = useState(EMPTY_EXPENSE);
  const toast = useToast();

  const load = () => {
    ownerApi.pnl(days).then(setPnl);
    ownerApi.listExpenses().then(setExpenses);
    ownerApi.getTax().then((t) => { setTax(t); setTaxForm(t); });
  };
  useEffect(load, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  const addExpense = async (e) => {
    e.preventDefault();
    try {
      await ownerApi.addExpense({
        ...expenseForm,
        amount: Number(expenseForm.amount),
      });
      toast.push("Expense logged", { tone: "success" });
      setExpenseForm(EMPTY_EXPENSE);
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const removeExpense = async (id) => {
    await ownerApi.deleteExpense(id);
    load();
  };

  const saveTax = async (e) => {
    e.preventDefault();
    try {
      await ownerApi.updateTax({
        ...taxForm,
        tax_rate: Number(taxForm.tax_rate),
      });
      toast.push("Tax settings saved", { tone: "success" });
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const fmt = (v) => `$${Number(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <AdminShell
      title="Finance"
      subtitle="Owner · P&L, expenses, compliance"
      actions={
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-sm"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>1 year</option>
        </select>
      }
    >
      {/* P&L Top-line */}
      {pnl && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <StatCard icon="payments" label="Net revenue" value={fmt(pnl.net_revenue)}
              delta={`${pnl.refunds > 0 ? `${fmt(pnl.refunds)} refunded` : "No refunds"}`} />
            <StatCard icon="trending_up" label="Gross profit" value={fmt(pnl.gross_profit)}
              delta={`${pnl.gross_margin_pct}% margin`} accent="tertiary" />
            <StatCard icon={pnl.net_profit >= 0 ? "savings" : "warning"}
              label="Net profit" value={fmt(pnl.net_profit)}
              delta={`${pnl.net_margin_pct}% net margin`}
              accent={pnl.net_profit >= 0 ? "tertiary" : "warning"} />
            <StatCard icon="receipt" label="Operating expenses" value={fmt(pnl.operating_expenses)}
              delta={`Labor ${fmt(pnl.labor)} · Overhead ${fmt(pnl.overhead)}`} />
          </div>

          <Section title="Profit & Loss statement" className="mb-6">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <PnLLine label="Gross revenue" value={pnl.gross_revenue} bold />
                <PnLLine label="Refunds" value={-pnl.refunds} subtle />
                <PnLLine label="Net revenue" value={pnl.net_revenue} bold underline />

                <PnLLine label="Cost of goods sold" value={-pnl.cogs} subtle />
                <PnLLine label="Gross profit" value={pnl.gross_profit} bold underline
                  hint={`${pnl.gross_margin_pct}% gross margin`} />

                <PnLLine label="Labor" value={-pnl.labor} subtle />
                <PnLLine label="Overhead" value={-pnl.overhead} subtle />
                <PnLLine label="Operating expenses" value={-pnl.operating_expenses} subtle muted />

                <div className="border-t-2 border-primary mt-3 pt-3">
                  <PnLLine label="Net profit" value={pnl.net_profit} large
                    hint={`${pnl.net_margin_pct}% net margin · ${days} days`} />
                </div>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-3">
                  Expense breakdown
                </p>
                {pnl.expense_breakdown.length === 0 ? (
                  <p className="text-on-surface-variant">No expenses logged in this period.</p>
                ) : (
                  <ul className="space-y-3">
                    {pnl.expense_breakdown.map((e) => {
                      const pct = pnl.overhead > 0 ? (e.amount / pnl.overhead) * 100 : 0;
                      return (
                        <li key={e.category}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="capitalize">{e.category}</span>
                            <span className="font-medium">{fmt(e.amount)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-surface-container-high overflow-hidden">
                            <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </Section>
        </>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Expense tracking */}
        <Section title="Expense tracking">
          <form onSubmit={addExpense} className="space-y-3 mb-4">
            <div className="grid grid-cols-2 gap-3">
              <select value={expenseForm.category}
                onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none">
                <option value="rent">Rent</option>
                <option value="utilities">Utilities</option>
                <option value="equipment">Equipment</option>
                <option value="marketing">Marketing</option>
                <option value="other">Other</option>
              </select>
              <input type="number" step="0.01" required value={expenseForm.amount}
                onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                placeholder="Amount ($)"
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            </div>
            <input value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              placeholder="Description"
              className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            <input value={expenseForm.vendor}
              onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
              placeholder="Vendor"
              className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            <button className="w-full h-11 rounded-full bg-primary text-on-primary text-sm font-medium">
              Log expense
            </button>
          </form>

          <p className="text-[11px] uppercase tracking-widest text-on-surface-variant mb-2">
            Recent expenses
          </p>
          {expenses.length === 0 ? (
            <p className="text-on-surface-variant text-center py-3">No expenses logged.</p>
          ) : (
            <ul className="space-y-1 max-h-72 overflow-y-auto">
              {expenses.slice(0, 12).map((e) => (
                <li key={e.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-surface-container-low text-sm">
                  <span className="px-2 py-0.5 rounded-full bg-surface-container text-[10px] uppercase tracking-widest capitalize w-20 text-center">
                    {e.category}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{e.description || e.vendor}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      {e.vendor} · {new Date(e.incurred_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-medium">{fmt(e.amount)}</span>
                  <button onClick={() => removeExpense(e.id)} className="text-on-surface-variant hover:text-error">
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Tax & Compliance */}
        <Section title="Tax & compliance hub">
          {taxForm && (
            <form onSubmit={saveTax} className="space-y-3">
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">Legal name</span>
                <input value={taxForm.legal_name || ""}
                  onChange={(e) => setTaxForm({ ...taxForm, legal_name: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
              </label>
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">Address</span>
                <input value={taxForm.address || ""}
                  onChange={(e) => setTaxForm({ ...taxForm, address: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
              </label>
              <div className="grid grid-cols-3 gap-3">
                <label className="block">
                  <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">Jurisdiction</span>
                  <input value={taxForm.jurisdiction}
                    onChange={(e) => setTaxForm({ ...taxForm, jurisdiction: e.target.value })}
                    className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">Sales tax %</span>
                  <input type="number" step="0.1" value={taxForm.tax_rate}
                    onChange={(e) => setTaxForm({ ...taxForm, tax_rate: e.target.value })}
                    className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
                </label>
                <label className="block">
                  <span className="text-[11px] uppercase tracking-widest text-on-surface-variant">Tax ID / EIN</span>
                  <input value={taxForm.tax_id || ""}
                    onChange={(e) => setTaxForm({ ...taxForm, tax_id: e.target.value })}
                    className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
                </label>
              </div>
              <button className="w-full h-11 rounded-full bg-primary text-on-primary text-sm font-medium">
                Save tax settings
              </button>
              {tax && (
                <p className="text-xs text-on-surface-variant">
                  Last updated {new Date(tax.updated_at).toLocaleString()}
                </p>
              )}
            </form>
          )}
        </Section>
      </div>
    </AdminShell>
  );
}

function PnLLine({ label, value, bold = false, large = false, subtle = false, underline = false, muted = false, hint }) {
  const cls = [
    "flex justify-between items-baseline py-1.5",
    bold ? "font-semibold" : "",
    large ? "font-serif text-2xl text-primary" : "",
    underline ? "border-b border-outline-variant" : "",
    muted ? "opacity-70" : "",
  ].join(" ");
  const isNeg = value < 0;
  const fmt = `${isNeg ? "-" : ""}$${Math.abs(value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  return (
    <div className={cls}>
      <div>
        <span>{label}</span>
        {hint && <p className="text-xs text-on-surface-variant font-normal">{hint}</p>}
      </div>
      <span className={(subtle && !bold ? "text-on-surface-variant " : "") + (isNeg && !bold ? "text-error" : "")}>
        {fmt}
      </span>
    </div>
  );
}
