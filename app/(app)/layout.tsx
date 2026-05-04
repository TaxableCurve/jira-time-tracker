"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { IssueList } from "@/components/issue-panel/IssueList";
import { useTimerStore } from "@/store/timer";
import { useCreateWorklog } from "@/hooks/useJira";
import { secondsToTimer } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/section-label";
import { Alert } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { LogoMark } from "@/components/ui/logo-mark";

function TimerBar() {
  const { issueKey, issueName, startTime, isRunning, stop } = useTimerStore();
  const createWorklog = useCreateWorklog();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isRunning || !startTime) return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(id);
  }, [isRunning, startTime]);

  if (!isRunning) return null;

  const handleStop = async () => {
    const result = stop();
    if (!result) return;
    const timeSpentSeconds = Math.max(result.durationSeconds, 60);
    await createWorklog.mutateAsync({
      issueKey: result.issueKey,
      timeSpentSeconds,
      startedAt: new Date(result.startTime).toISOString(),
    });
  };

  return (
    <div
      className="flex items-center gap-3 px-3 py-1.5"
      style={{ background: "rgba(232,124,46,0.08)", borderBottom: "1px solid rgba(232,124,46,0.15)" }}
    >
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-primary" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
      </span>
      <span className="font-sans text-xs flex-1 truncate text-[#B0B0B8]">
        {issueKey} — {issueName}
      </span>
      <span className="font-mono text-sm tabular-nums font-medium text-primary">
        {secondsToTimer(elapsed)}
      </span>
      <Button
        variant="toggle"
        size="xs"
        isActive
        disabled={createWorklog.isPending}
        onClick={handleStop}
      >
        {createWorklog.isPending ? "Saving..." : "Stop →"}
      </Button>
    </div>
  );
}

function SettingsModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [form, setForm] = useState(() => {
    if (typeof window === "undefined") return { baseUrl: "", email: "", token: "" };
    const raw = localStorage.getItem("jira_config");
    if (!raw) return { baseUrl: "", email: "", token: "" };
    const config = JSON.parse(raw);
    return { baseUrl: config.baseUrl ?? "", email: config.email ?? "", token: config.token ?? "" };
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    const baseUrl = form.baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

    try {
      const res = await fetch("/api/jira/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, email: form.email, token: form.token }),
      });
      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(data.error ?? "Could not connect to Jira");
        return;
      }

      localStorage.setItem(
        "jira_config",
        JSON.stringify({ baseUrl, email: form.email, token: form.token, accountId: data.accountId })
      );
      setStatus("success");
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 800);
    } catch {
      setStatus("error");
      setErrorMsg("Network error — check your connection");
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("jira_config");
    router.replace("/setup");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(12,12,14,0.8)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm p-6 relative"
        style={{ background: "#14141A", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="font-sans text-sm font-bold text-foreground">Credentials</span>
          <Button variant="ghost" size="icon-xs" onClick={onClose}>✕</Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <FieldLabel>Jira URL</FieldLabel>
            <Input
              type="text"
              placeholder="empresa.atlassian.net"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              required
            />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="tu@empresa.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <FieldLabel>API Token</FieldLabel>
            <Input
              type="password"
              placeholder="••••••••••••••••"
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              required
            />
          </div>

          {status === "error" && <Alert variant="error">⚠ {errorMsg}</Alert>}
          {status === "success" && <Alert variant="success">✓ Connected</Alert>}

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              variant="primary"
              className="flex-1 font-sans uppercase tracking-wider py-2"
              disabled={status === "loading" || status === "success"}
            >
              {status === "loading" ? "Saving..." : "Save →"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="px-3"
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center font-mono text-[10px] uppercase tracking-[0.12em] px-3 py-1.5 rounded transition-all border",
        isActive
          ? "bg-primary/12 text-primary border-primary/25"
          : "bg-white/4 text-muted-foreground border-white/7 hover:bg-white/8 hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

function AppShell({ children }: { children: React.ReactNode }) {
  const { start, issueKey: activeKey } = useTimerStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="flex flex-col h-screen">
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <TimerBar />

      {/* Top nav */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/6">
        <div className="flex items-center gap-2 mr-4">
          <LogoMark size={22} />
          <span className="font-sans text-xs font-bold text-foreground">Time Tracker</span>
        </div>
        <NavLink href="/calendar">Calendar</NavLink>
        <NavLink href="/reports">Reports</NavLink>
        <div className="ml-auto">
          <Button variant="ghost" size="xs" onClick={() => setShowSettings(true)}>
            Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 flex-shrink-0 flex flex-col overflow-hidden border-r border-white/6">
          <IssueList
            activeIssueKey={activeKey ?? undefined}
            onStartTimer={(issue) => start(issue.key, issue.fields.summary)}
          />
        </aside>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      <div
        className="flex items-center justify-between px-4 py-1.5 border-t border-white/4"
        style={{ background: "rgba(255,255,255,0.01)" }}
      >
        <span className="font-mono text-[9px] text-white/15 tracking-widest">v1.1.0</span>
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const config = localStorage.getItem("jira_config");
    if (!config) router.replace("/setup");
  }, [router]);

  return <AppShell>{children}</AppShell>;
}
