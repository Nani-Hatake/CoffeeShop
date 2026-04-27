import { useEffect, useState } from "react";

import AdminShell, { Section, StatCard } from "../../../components/admin/AdminShell.jsx";
import { ownerApi } from "../../../api";
import { useToast } from "../../../contexts/ToastContext.jsx";

const EMPTY_STAFF = {
  full_name: "", email: "", phone: "", position: "Barista",
  employment_type: "hourly", hourly_rate: 22, monthly_salary: 0,
  overtime_multiplier: 1.5, bank_account: "", store_id: null,
  certifications: "", health_permit_expires: null, hire_date: null,
  active: true, notes: "",
};

export default function Workforce() {
  const [staff, setStaff] = useState([]);
  const [stores, setStores] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [payroll, setPayroll] = useState(null);
  const [period, setPeriod] = useState(14);
  const [editing, setEditing] = useState(null);
  const [shiftForm, setShiftForm] = useState({ staff_id: "", store_id: "", start: "", end: "", role: "", bonus: 0 });
  const toast = useToast();

  const load = () => {
    ownerApi.listStaff().then(setStaff);
    ownerApi.listStores().then(setStores);
    ownerApi.listShifts({ days: period }).then(setShifts);
    ownerApi.payroll(period).then(setPayroll);
  };
  useEffect(load, [period]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveStaff = async (form) => {
    try {
      const payload = { ...form };
      if (form.id) {
        await ownerApi.updateStaff(form.id, payload);
        toast.push("Staff member updated", { tone: "success" });
      } else {
        await ownerApi.enrollStaff(payload);
        toast.push("Staff member enrolled", { tone: "success" });
      }
      setEditing(null);
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const offboard = async (s) => {
    if (!confirm(`Mark ${s.full_name} as inactive?`)) return;
    await ownerApi.offboardStaff(s.id);
    toast.push("Staff member offboarded");
    load();
  };

  const scheduleShift = async (e) => {
    e.preventDefault();
    try {
      await ownerApi.scheduleShift({
        staff_id: Number(shiftForm.staff_id),
        store_id: shiftForm.store_id ? Number(shiftForm.store_id) : null,
        start: new Date(shiftForm.start).toISOString(),
        end: new Date(shiftForm.end).toISOString(),
        role: shiftForm.role || null,
        bonus: Number(shiftForm.bonus) || 0,
      });
      toast.push("Shift scheduled");
      setShiftForm({ staff_id: "", store_id: "", start: "", end: "", role: "", bonus: 0 });
      load();
    } catch (err) {
      toast.push(err.message, { tone: "error" });
    }
  };

  const removeShift = async (id) => {
    await ownerApi.removeShift(id);
    load();
  };

  return (
    <AdminShell
      title="Workforce"
      subtitle="Owner · Staffing & enrollment"
      actions={
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
          <button
            onClick={() => setEditing(EMPTY_STAFF)}
            className="px-4 h-10 rounded-full bg-primary text-on-primary text-sm font-medium inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Enroll
          </button>
        </div>
      }
    >
      {/* Payroll summary */}
      {payroll && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <StatCard icon="payments" label="Gross payroll"
            value={`$${payroll.total_gross.toFixed(2)}`}
            delta={`${payroll.total_hours}h worked`} />
          <StatCard icon="account_balance" label="Net (after est. tax)"
            value={`$${payroll.total_net.toFixed(2)}`} accent="tertiary" />
          <StatCard icon="schedule" label="Overtime"
            value={`${payroll.total_overtime.toFixed(1)}h`}
            accent={payroll.total_overtime > 5 ? "warning" : "primary"} />
          <StatCard icon="trending_up" label="Labor % of revenue"
            value={`${payroll.labor_pct}%`}
            delta={`Revenue $${payroll.revenue.toFixed(2)}`} />
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Staff directory */}
        <Section title={`Staff directory (${staff.length})`}>
          {staff.length === 0 ? (
            <p className="text-on-surface-variant text-center py-6">No staff yet. Enroll your first crew member.</p>
          ) : (
            <ul className="space-y-3">
              {staff.map((s) => (
                <li key={s.id} className="flex gap-3 p-3 rounded-xl bg-surface-container-low">
                  <div className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center font-serif">
                    {s.full_name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{s.full_name}</p>
                      <span className="text-[10px] uppercase tracking-widest bg-primary-container text-on-primary px-2 py-0.5 rounded-full">
                        {s.position}
                      </span>
                      {!s.active && <span className="text-[10px] uppercase tracking-widest bg-error-container text-on-error-container px-2 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-on-surface-variant truncate">
                      {s.email} · {s.store_name || "—"}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {s.employment_type === "hourly"
                        ? `$${s.hourly_rate}/hr (×${s.overtime_multiplier} OT)`
                        : `Salary $${s.monthly_salary}/mo`}
                      {s.certifications && ` · ${s.certifications.split(",")[0]}`}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => setEditing(s)} className="text-primary hover:opacity-80" aria-label="Edit">
                      <span className="material-symbols-outlined text-[20px]">edit</span>
                    </button>
                    {s.active && (
                      <button onClick={() => offboard(s)} className="text-on-surface-variant hover:text-error" aria-label="Offboard">
                        <span className="material-symbols-outlined text-[20px]">person_off</span>
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Section>

        {/* Schedule shift */}
        <Section title="Schedule a shift">
          <form onSubmit={scheduleShift} className="space-y-3">
            <select required value={shiftForm.staff_id}
              onChange={(e) => setShiftForm({ ...shiftForm, staff_id: e.target.value })}
              className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none">
              <option value="">Select staff…</option>
              {staff.filter(s => s.active).map((s) => (
                <option key={s.id} value={s.id}>{s.full_name} — {s.position}</option>
              ))}
            </select>
            <select value={shiftForm.store_id}
              onChange={(e) => setShiftForm({ ...shiftForm, store_id: e.target.value })}
              className="w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none">
              <option value="">No specific store</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">Start</span>
                <input type="datetime-local" required value={shiftForm.start}
                  onChange={(e) => setShiftForm({ ...shiftForm, start: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">End</span>
                <input type="datetime-local" required value={shiftForm.end}
                  onChange={(e) => setShiftForm({ ...shiftForm, end: e.target.value })}
                  className="mt-1 w-full h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input value={shiftForm.role}
                onChange={(e) => setShiftForm({ ...shiftForm, role: e.target.value })}
                placeholder="Role on shift"
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
              <input type="number" step="5" value={shiftForm.bonus}
                onChange={(e) => setShiftForm({ ...shiftForm, bonus: e.target.value })}
                placeholder="Bonus ($)"
                className="h-11 px-3 rounded-lg bg-surface-container-low border border-outline-variant outline-none" />
            </div>
            <button className="w-full h-11 rounded-full bg-primary text-on-primary font-medium text-sm">
              Schedule shift
            </button>
          </form>
        </Section>
      </div>

      {/* Payroll lines */}
      {payroll && payroll.lines.length > 0 && (
        <Section title="Payroll run">
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-widest text-on-surface-variant border-b border-outline-variant">
                  <th className="px-6 py-2">Staff</th>
                  <th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2 text-right">Hours</th>
                  <th className="px-3 py-2 text-right">OT</th>
                  <th className="px-3 py-2 text-right">Base</th>
                  <th className="px-3 py-2 text-right">OT pay</th>
                  <th className="px-3 py-2 text-right">Bonus</th>
                  <th className="px-3 py-2 text-right">Gross</th>
                  <th className="px-6 py-2 text-right">Net</th>
                </tr>
              </thead>
              <tbody>
                {payroll.lines.map((l) => (
                  <tr key={l.staff_id} className="border-b border-outline-variant last:border-0">
                    <td className="px-6 py-2">
                      <p className="font-medium">{l.full_name}</p>
                      <p className="text-xs text-on-surface-variant">{l.position}</p>
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant text-xs uppercase tracking-widest">{l.employment_type}</td>
                    <td className="px-3 py-2 text-right">{l.hours_regular}</td>
                    <td className="px-3 py-2 text-right">{l.hours_overtime}</td>
                    <td className="px-3 py-2 text-right">${l.base_pay.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">${l.overtime_pay.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">${l.bonus.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-semibold">${l.gross.toFixed(2)}</td>
                    <td className="px-6 py-2 text-right text-primary font-semibold">${l.net.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-surface-container-low font-semibold">
                  <td className="px-6 py-3">Totals</td>
                  <td colSpan={2} className="px-3 py-3 text-right">{payroll.total_hours}h</td>
                  <td className="px-3 py-3 text-right">{payroll.total_overtime}h</td>
                  <td colSpan={3}></td>
                  <td className="px-3 py-3 text-right">${payroll.total_gross.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right text-primary">${payroll.total_net.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Section>
      )}

      {/* Recent shifts */}
      <Section title={`Shifts (${shifts.length})`} className="mt-6">
        {shifts.length === 0 ? (
          <p className="text-on-surface-variant text-center py-6">No shifts in the last {period} days.</p>
        ) : (
          <ul className="space-y-1 max-h-96 overflow-y-auto">
            {shifts.map((sh) => (
              <li key={sh.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low text-sm">
                <span className="font-medium w-40 truncate">{sh.staff_name}</span>
                <span className="text-on-surface-variant text-xs flex-1">
                  {new Date(sh.start).toLocaleString()} – {new Date(sh.end).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                </span>
                <span className="text-on-surface-variant">{sh.role || "—"}</span>
                <span className="text-on-surface-variant">{sh.hours}h</span>
                <span className="text-on-surface-variant truncate w-32 text-xs">{sh.store_name || "—"}</span>
                <button onClick={() => removeShift(sh.id)} className="text-on-surface-variant hover:text-error">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {editing && (
        <StaffEditor staff={editing} stores={stores} onSave={saveStaff} onClose={() => setEditing(null)} />
      )}
    </AdminShell>
  );
}

function StaffEditor({ staff, stores, onSave, onClose }) {
  const initial = {
    ...staff,
    health_permit_expires: staff.health_permit_expires ? staff.health_permit_expires.slice(0, 10) : "",
    hire_date: staff.hire_date ? staff.hire_date.slice(0, 10) : "",
  };
  const [form, setForm] = useState(initial);
  const update = (k) => (e) => {
    const v = e.target.type === "checkbox" ? e.target.checked
      : e.target.type === "number" ? Number(e.target.value)
      : e.target.value;
    setForm({ ...form, [k]: v });
  };
  const submit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      store_id: form.store_id ? Number(form.store_id) : null,
      health_permit_expires: form.health_permit_expires
        ? new Date(form.health_permit_expires).toISOString() : null,
      hire_date: form.hire_date ? new Date(form.hire_date).toISOString() : null,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full mx-auto my-6 p-6">
        <header className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-2xl text-primary">
            {staff.id ? `Edit · ${staff.full_name}` : "Enroll new staff"}
          </h3>
          <button onClick={onClose} className="text-on-surface-variant"><span className="material-symbols-outlined">close</span></button>
        </header>

        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3">
          <Field label="Full name" required>
            <input value={form.full_name} onChange={update("full_name")} required className="input" />
          </Field>
          <Field label="Email" required>
            <input type="email" value={form.email} onChange={update("email")} required disabled={!!staff.id} className="input" />
          </Field>
          <Field label="Phone">
            <input value={form.phone || ""} onChange={update("phone")} className="input" />
          </Field>
          <Field label="Position">
            <select value={form.position} onChange={update("position")} className="input">
              <option>Barista</option>
              <option>Bar lead</option>
              <option>Roaster</option>
              <option>Head Roaster</option>
              <option>Manager</option>
              <option>Admin</option>
            </select>
          </Field>
          <Field label="Employment type">
            <select value={form.employment_type} onChange={update("employment_type")} className="input">
              <option value="hourly">Hourly</option>
              <option value="salaried">Salaried</option>
            </select>
          </Field>
          <Field label="Store">
            <select value={form.store_id || ""} onChange={update("store_id")} className="input">
              <option value="">No specific store</option>
              {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </Field>
          {form.employment_type === "hourly" ? (
            <>
              <Field label="Hourly rate ($)">
                <input type="number" step="0.5" value={form.hourly_rate} onChange={update("hourly_rate")} className="input" />
              </Field>
              <Field label="Overtime multiplier">
                <input type="number" step="0.1" value={form.overtime_multiplier} onChange={update("overtime_multiplier")} className="input" />
              </Field>
            </>
          ) : (
            <Field label="Monthly salary ($)" full>
              <input type="number" step="50" value={form.monthly_salary} onChange={update("monthly_salary")} className="input" />
            </Field>
          )}
          <Field label="Bank account (last 4)">
            <input value={form.bank_account || ""} onChange={update("bank_account")} placeholder="****1234" className="input" />
          </Field>
          <Field label="Hire date">
            <input type="date" value={form.hire_date} onChange={update("hire_date")} className="input" />
          </Field>
          <Field label="Health permit expires" full>
            <input type="date" value={form.health_permit_expires} onChange={update("health_permit_expires")} className="input" />
          </Field>
          <Field label="Certifications (comma-separated)" full>
            <input value={form.certifications || ""} onChange={update("certifications")} className="input" placeholder="SCA Barista L2, Food Handler" />
          </Field>
          <Field label="Notes" full>
            <textarea value={form.notes || ""} onChange={update("notes")} rows={2} className="input" />
          </Field>

          <label className="sm:col-span-2 inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={update("active")} />
            Active
          </label>

          <div className="sm:col-span-2 flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 h-11 rounded-full border border-outline-variant text-sm">Cancel</button>
            <button type="submit"
              className="flex-1 h-11 rounded-full bg-primary text-on-primary text-sm font-medium">
              {staff.id ? "Save changes" : "Enroll staff"}
            </button>
          </div>
        </form>

        <style>{`
          .input { width: 100%; height: 40px; padding: 0 12px; border-radius: 8px;
            background: #fff1e4; border: 1px solid #d3c3c0; outline: none; }
          .input:focus { border-color: #271310; }
          textarea.input { padding: 8px 12px; height: auto; min-height: 60px; }
        `}</style>
      </div>
    </div>
  );
}

function Field({ label, children, required, full }) {
  return (
    <label className={"block " + (full ? "sm:col-span-2" : "")}>
      <span className="text-[11px] uppercase tracking-widest text-on-surface-variant block mb-1">
        {label}{required && " *"}
      </span>
      {children}
    </label>
  );
}
