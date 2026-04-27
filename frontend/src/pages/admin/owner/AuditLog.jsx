import { useEffect, useState } from "react";

import AdminShell, { Section } from "../../../components/admin/AdminShell.jsx";
import { ownerApi } from "../../../api";

const ACTION_ICONS = {
  "product.create": "add",
  "product.update": "edit",
  "product.delete": "delete",
  "product.availability": "visibility",
  "stock.update": "inventory",
  "waste.create": "delete_sweep",
  "order.ready": "check_circle",
  "order.collected": "task_alt",
  "order.cancelled": "cancel",
  "order.refunded": "currency_exchange",
  "staff.enroll": "person_add",
  "staff.update": "person",
  "staff.offboard": "person_off",
  "shift.create": "schedule",
  "shift.delete": "schedule_send",
  "expense.create": "receipt",
  "expense.delete": "delete",
  "tax.update": "gavel",
  "lab.create": "science",
  "lab.update": "edit",
  "lab.publish": "rocket_launch",
  "lab.delete": "delete",
  "margin.upsert": "percent",
  "review.create": "rate_review",
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState({ target_type: "", action: "" });

  const load = () => {
    ownerApi.auditLogs(filter).then(setLogs);
  };
  useEffect(load, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const targetTypes = [...new Set(logs.map((l) => l.target_type).filter(Boolean))];
  const actions = [...new Set(logs.map((l) => l.action))];

  return (
    <AdminShell
      title="Audit log"
      subtitle="Owner · Transparency"
      actions={
        <div className="flex gap-2">
          <select value={filter.target_type}
            onChange={(e) => setFilter({ ...filter, target_type: e.target.value })}
            className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-sm">
            <option value="">All targets</option>
            {targetTypes.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filter.action}
            onChange={(e) => setFilter({ ...filter, action: e.target.value })}
            className="h-9 px-3 rounded-full bg-surface-container-low border border-outline-variant text-sm">
            <option value="">All actions</option>
            {actions.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      }
    >
      <Section title={`${logs.length} entries`}>
        {logs.length === 0 ? (
          <p className="text-on-surface-variant text-center py-12">
            No matching entries. Audit entries are written automatically as admins act.
          </p>
        ) : (
          <ul className="space-y-2">
            {logs.map((l) => (
              <li key={l.id} className="flex gap-3 p-4 rounded-xl bg-surface-container-low">
                <div className="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-[20px]">
                    {ACTION_ICONS[l.action] || "history"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-surface-container">
                      {l.action}
                    </span>
                    {l.target_type && (
                      <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                        {l.target_type}
                        {l.target_id && <span className="font-mono normal-case ml-1 text-on-surface">{l.target_id}</span>}
                      </span>
                    )}
                  </div>
                  {l.summary && <p className="text-sm text-on-surface mt-1">{l.summary}</p>}
                  <p className="text-xs text-on-surface-variant mt-1">
                    <span className="font-medium">{l.actor_email || "system"}</span>
                    {l.actor_role && <span className="ml-1 text-[10px] uppercase tracking-widest opacity-70">({l.actor_role})</span>}
                    <span className="mx-2">·</span>
                    {new Date(l.created_at).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </AdminShell>
  );
}
