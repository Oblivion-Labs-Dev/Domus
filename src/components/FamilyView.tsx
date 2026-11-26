"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BellRing,
  Check,
  Crown,
  DoorOpen,
  History,
  Lock,
  Minus,
  Send,
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
import TiltCard from "./TiltCard";
import { AuditLogDTO, MemberDTO, RoomKnockDTO } from "./types";

interface FamilyViewProps {
  currentMember: MemberContext;
  onHouseholdChanged: () => Promise<void>;
  onVisitRoom: (memberId: string) => void;
}

const ROLES: Role[] = ["HEAD", "CO_HEAD", "MEMBER", "JUNIOR", "GUEST"];

export default function FamilyView({
  currentMember,
  onHouseholdChanged,
  onVisitRoom,
}: FamilyViewProps) {
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogDTO[]>([]);
  const [outgoingKnocks, setOutgoingKnocks] = useState<RoomKnockDTO[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);

  // Knock modal inline state
  const [knockingOwnerId, setKnockingOwnerId] = useState<string | null>(null);
  const [knockMessage, setKnockMessage] = useState("");

  // Invite form
  const [showInvite, setShowInvite] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("MEMBER");
  const [title, setTitle] = useState("Family Member");

  async function loadFamily() {
    const [famRes, knockRes] = await Promise.all([
      fetch("/api/family/members"),
      fetch("/api/rooms/knocks"),
    ]);
    if (famRes.ok) {
      const d = await famRes.json();
      setMembers(d.members ?? []);
      setAuditLogs(d.auditLogs ?? []);
    }
    if (knockRes.ok) {
      const d = await knockRes.json();
      setOutgoingKnocks(d.outgoing ?? []);
    }
  }

  useEffect(() => {
    loadFamily();
  }, [currentMember.id]);

  const canInvite = can(currentMember, "family:invite_member");
  const canManageRoles = can(currentMember, "family:manage_roles");
  const canViewAudit = can(currentMember, "family:view_audit_log");

  async function handleSendKnock(e: React.FormEvent, roomOwnerId: string) {
    e.preventDefault();
    setFeedback(null);
    const res = await fetch("/api/rooms/knocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomOwnerId,
        message: knockMessage,
      }),
    });
    const d = await res.json();
    if (!res.ok) {
      setFeedback({ type: "err", text: d.error ?? "Could not knock" });
      return;
    }
    setKnockingOwnerId(null);
    setKnockMessage("");
    setFeedback({
      type: "ok",
      text: "Knock sent! Once they open their door, you can step inside.",
    });
    await loadFamily();
  }

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
          <p className="text-[11px] font-bold uppercase tracking-widest text-terracotta-600">
            Hallway of Private Doors &amp; Governance
          </p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            Family Doors &amp; Household Roles
          </h2>
          <p className="text-sm text-stone-500">
            Everyone&apos;s room is private by default. Knock on a door with a
            message to request a visit — and manage household roles below.
          </p>
        </div>

        {canInvite && (
          <button
            onClick={() => setShowInvite((v) => !v)}
            className="domus-btn-primary whitespace-nowrap"
          >
            <UserPlus className="h-4 w-4" />
            {showInvite ? "Close Form" : "Add Family Member"}
          </button>
        )}
      </div>

      {feedback && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border px-4 py-2.5 text-sm font-medium ${
            feedback.type === "ok"
              ? "border-sage-200 bg-sage-50 text-sage-700"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {feedback.text}
        </motion.div>
      )}

      <AnimatePresence>
        {showInvite && canInvite && (
          <motion.form
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onSubmit={handleInvite}
            className="domus-card space-y-4 p-5"
          >
            <h3 className="text-sm font-bold text-stone-900">
              Add a Member to Your Household
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name (e.g., Grandma)"
                className="domus-input"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="grandma@domus.local"
                className="domus-input"
              />
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
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Relationship label"
                className="domus-input"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowInvite(false)}
                className="domus-btn-secondary text-xs"
              >
                Cancel
              </button>
              <button type="submit" className="domus-btn-primary text-xs">
                Add Member
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* 2.5D Hallway of Family Doors */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {members.map((m, idx) => {
          const isMe = m.id === currentMember.id;
          const knock = outgoingKnocks.find((k) => k.roomOwnerId === m.id);
          const isAllowed = isMe || knock?.status === "ALLOWED";
          const isKnocking = knock?.status === "KNOCKING";

          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <TiltCard
                maxTilt={5}
                lift={5}
                glowColor={`${m.color}22`}
                className="flex flex-col justify-between space-y-4 p-5"
              >
                <div className="flex items-start gap-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/door-3d.png"
                    alt={`${m.name}'s Door`}
                    className="h-16 w-16 shrink-0 rounded-2xl border-2 border-white bg-[#faf9f5] object-cover shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-bold text-stone-900">
                        {m.name}&apos;s Room
                      </h3>
                      {m.role === "HEAD" && (
                        <Crown className="h-3.5 w-3.5 shrink-0 text-terracotta-500" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-stone-500">
                      {m.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {isAllowed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-bold text-sage-700">
                          <DoorOpen className="h-3 w-3" />
                          {isMe ? "Your Room" : "Door Open"}
                        </span>
                      ) : isKnocking ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                          <BellRing className="h-3 w-3" />
                          Knocking...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-bold text-stone-600">
                          <Lock className="h-3 w-3" />
                          Private · Knock to Visit
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Door Action: Enter or Knock with a Message */}
                <div className="space-y-2.5 border-t border-stone-100 pt-3">
                  {isAllowed ? (
                    <button
                      onClick={() => onVisitRoom(m.id)}
                      className="domus-btn-primary w-full py-2 text-xs"
                    >
                      <DoorOpen className="h-3.5 w-3.5" />
                      {isMe ? "Enter My Room" : `Step Into ${m.name}'s Room`}
                    </button>
                  ) : knockingOwnerId === m.id ? (
                    <form
                      onSubmit={(e) => handleSendKnock(e, m.id)}
                      className="space-y-2"
                    >
                      <input
                        required
                        value={knockMessage}
                        onChange={(e) => setKnockMessage(e.target.value)}
                        placeholder={`Message for ${m.name} (e.g., Mind if I peek at your board?)`}
                        className="domus-input text-xs"
                      />
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setKnockingOwnerId(null)}
                          className="domus-btn-secondary px-2.5 py-1 text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="domus-btn-accent px-3 py-1 text-xs"
                        >
                          <Send className="h-3 w-3" />
                          Knock!
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        setKnockingOwnerId(m.id);
                        setKnockMessage("");
                      }}
                      className="domus-btn-secondary w-full py-2 text-xs"
                    >
                      <BellRing className="h-3.5 w-3.5 text-terracotta-500" />
                      {isKnocking
                        ? "Knock Again with New Message"
                        : `Knock on ${m.name}'s Door`}
                    </button>
                  )}

                  {/* Head of Household Role & Override Controls */}
                  {canManageRoles && !isMe && (
                    <div className="flex items-center justify-between gap-2 pt-1">
                      <span className="text-[10px] font-bold uppercase text-stone-400">
                        Role:
                      </span>
                      <select
                        value={m.role}
                        onChange={(e) =>
                          handleUpdateMember(m.id, {
                            role: e.target.value as Role,
                          })
                        }
                        className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 text-[11px] font-bold text-stone-800"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_META[r].label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      {/* RBAC Matrix */}
      <div className="domus-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-stone-200 px-5 py-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-terracotta-500" />
            <h3 className="text-sm font-bold text-stone-900">
              Household RBAC Matrix
            </h3>
          </div>
          <span className="text-xs text-stone-500">
            Active role:{" "}
            <strong className="text-stone-900">
              {ROLE_META[currentMember.role].label}
            </strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500">
              <tr>
                <th className="px-5 py-3 font-bold">Capability</th>
                {ROLES.map((r) => (
                  <th
                    key={r}
                    className={`px-3 py-3 text-center font-bold ${
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
                <tr key={row.action} className="hover:bg-stone-50/70">
                  <td className="px-5 py-3 font-semibold text-stone-800">
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
                          <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">
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
      {canViewAudit && auditLogs.length > 0 && (
        <div className="domus-card p-5">
          <div className="mb-3 flex items-center gap-2">
            <History className="h-4 w-4 text-stone-500" />
            <h3 className="text-sm font-bold text-stone-900">
              Household Governance Audit Log
            </h3>
          </div>
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="domus-tile flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
              >
                <span className="font-semibold text-stone-800">
                  {log.summary}
                </span>
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
