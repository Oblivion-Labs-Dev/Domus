"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Crown,
  History,
  Minus,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import {
  can,
  MemberContext,
  PermissionOverrides,
  Role,
  ROLE_CAPABILITY_MATRIX,
  ROLE_META,
} from "@/lib/rbac";
import { AuditLogDTO, MemberDTO } from "./types";

interface FamilyViewProps {
  currentMember: MemberContext;
  onHouseholdChanged: () => Promise<void>;
}

const ROLES: Role[] = ["HEAD", "CO_HEAD", "MEMBER", "JUNIOR", "GUEST"];

export default function FamilyView({
  currentMember,
  onHouseholdChanged,
}: FamilyViewProps) {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDTO[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [title, setTitle] = useState("Family Member");

  async function loadFamily() {
    const res = await fetch("/api/family/members");
    if (res.ok) {
      const d = await res.json();
      setMembers(d.members ?? []);
      setAuditLogs(d.auditLogs ?? []);
    }
  }

  useEffect(() => {
    loadFamily();
  }, [currentMember.id]);

  const canInvite = can(currentMember, "family:invite_member");
  const canManageRoles = can(currentMember, "family:manage_roles");
  const canViewAudit = can(currentMember, "family:view_audit_log");

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/family/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        role,
        title,
        color: "#4f7c5b",
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: d.error ?? "Invite failed" });
      return;
    }
    setName("");
    setEmail("");
    setShowInvite(false);
    setFeedback({
      type: "ok",
      text: `${name} added to the household (default password: domus123).`,
    });
    await loadFamily();
    await onHouseholdChanged();
  }

  async function handleUpdateMember(
    memberId: string,
    payload: { role?: Role; permissions?: PermissionOverrides }
  ) {
    setFeedback(null);
    const res = await fetch(`/api/family/members/${memberId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: d.error ?? "Update blocked" });
      return;
    }
    setFeedback({ type: "ok", text: "Household permissions updated." });
    await loadFamily();
    await onHouseholdChanged();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-terracotta-600">
            Household Governance
          </p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-stone-900">
            Family Roles &amp; Permissions
          </h2>
          <p className="text-sm text-stone-500">
            Real household hierarchy with Head of Family authority, granular
            member overrides, and privacy-first visibility boundaries.
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="domus-btn-primary"
          >
            <UserPlus className="h-4 w-4" />
            {showInvite ? "Close Form" : "Add Family Member"}
          </button>
        )}
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-sm ${
            feedback.type === "ok"
              ? "border-sage-200 bg-sage-50 text-sage-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {showInvite && canInvite && (
        <form onSubmit={handleInvite} className="domus-card space-y-4 p-5">
          <h3 className="text-sm font-semibold text-stone-900">
            Add a Member to Your Household
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Name
              </label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grandma"
                className="domus-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="grandma@domus.local"
                className="domus-input"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Household Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="domus-input"
              >
                {ROLES.filter(
                  (r) => r !== "HEAD" || currentMember.role === "HEAD"
                ).map((r) => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">
                Relationship Label
              </label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Grandmother · Member"
                className="domus-input"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="domus-btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="domus-btn-primary">
              Add Member
            </button>
          </div>
        </form>
      )}

      {/* Family Roster & Live Role Controls */}
      <div className="grid gap-4 md:grid-cols-2">
        {members.map((m) => {
          const isHead = m.role === "HEAD";
          return (
            <div key={m.id} className="domus-card space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.avatarInitials}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-sm font-semibold text-stone-900">
                        {m.name}
                      </h3>
                      {isHead && (
                        <Crown className="h-3.5 w-3.5 text-terracotta-500" />
                      )}
                      {m.id === currentMember.id && (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[10px] font-medium text-stone-600">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500">{m.title}</p>
                    <p className="text-[11px] text-stone-400">{m.email}</p>
                  </div>
                </div>

                {canManageRoles && m.id !== currentMember.id ? (
                  <select
                    value={m.role}
                    onChange={(e) =>
                      handleUpdateMember(m.id, { role: e.target.value as Role })
                    }
                    className="rounded-lg border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-800"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_META[r].label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                    {ROLE_META[m.role]?.label ?? m.role}
                  </span>
                )}
              </div>

              <p className="text-xs text-stone-500">
                {ROLE_META[m.role]?.description}
              </p>

              {/* Granular Overrides (HEAD editable) */}
              <div className="border-t border-stone-100 pt-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">
                  Permission Overrides
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["canApproveBookings", "Approve Bookings"],
                      ["canManageLists", "Manage Lists"],
                      ["canViewAllHealth", "View Health Trackers"],
                      ["canBookWithoutApproval", "Book Without Approval"],
                    ] as const
                  ).map(([key, label]) => {
                    const active = Boolean(m.permissions?.[key]);
                    return (
                      <button
                        key={key}
                        disabled={!canManageRoles}
                        onClick={() =>
                          handleUpdateMember(m.id, {
                            permissions: { [key]: !active },
                          })
                        }
                        className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                          active
                            ? "border-sage-300 bg-sage-50 text-sage-700"
                            : "border-stone-200 bg-stone-50 text-stone-500"
                        } disabled:cursor-default disabled:opacity-75`}
                      >
                        {active ? "✓ " : "+ "}
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* RBAC Matrix */}
      <div className="domus-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-terracotta-500" />
            <h3 className="text-sm font-semibold text-stone-900">
              Household RBAC Matrix
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            Your active role:{" "}
            <strong className="text-stone-900">
              {ROLE_META[currentMember.role].label}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Capability</th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    className={`px-3 py-3 text-center font-semibold ${
                      currentMember.role === r
                        ? "bg-terracotta-50 text-terracotta-700"
                        : ""
                    }`}
                  >
                    {ROLE_META[r].badge}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ROLE_CAPABILITY_MATRIX.map((row) => (
                <tr key={row.action} className="hover:bg-stone-50/50">
                  <td className="px-5 py-3 font-medium text-stone-800">
                    {row.label}
                  </td>
                  {ROLES.map((r) => {
                    const val = row.roles[r];
                    const highlight = currentMember.role === r;
                    return (
                      <td
                        key={r}
                        className={`px-3 py-3 text-center ${
                          highlight ? "bg-terracotta-50/40" : ""
                        }`}
                      >
                        {val === true ? (
                          <Check className="mx-auto h-4 w-4 text-sage-600" />
                        ) : val === false ? (
                          <Minus className="mx-auto h-4 w-4 text-stone-300" />
                        ) : (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-800">
                            {val}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log */}
      {canViewAudit && (
        <div className="domus-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-stone-500" />
            <h3 className="text-sm font-semibold text-stone-900">
              Household Governance Audit Log
            </h3>
          </div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-stone-50 px-3.5 py-2.5 text-xs"
              >
                <span className="font-medium text-stone-800">{log.summary}</span>
                <span className="text-[11px] text-stone-400">
                  {new Date(log.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
