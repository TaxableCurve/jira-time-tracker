"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldLabel } from "@/components/ui/section-label";
import { Alert } from "@/components/ui/alert";
import { LogoMark } from "@/components/ui/logo-mark";
import { LogIn } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ baseUrl: "", email: "", token: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
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

      router.push("/calendar");
    } catch {
      setStatus("error");
      setErrorMsg("Network error — check your connection");
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">

      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(232,124,46,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,124,46,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(232,124,46,0.08) 0%, transparent 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="relative w-full max-w-sm">

        {/* Header */}
        <div className="mb-10 animate-fade-up">
          <div className="flex items-center gap-3 mb-6">
            <LogoMark size={36} />
            <span className="font-mono text-xs tracking-[0.2em] uppercase text-primary">
              Time Tracker
            </span>
          </div>

          <h1 className="font-sans text-4xl font-extrabold leading-none tracking-tight mb-2">
            Connect
            <br />
            <span className="text-primary">Jira.</span>
          </h1>
          <p className="font-mono text-sm mt-3 text-[#6B6B72]">
            Use a personal API token to authenticate.{" "}
            <a
              href="https://id.atlassian.com/manage-profile/security/api-tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Generate one ↗
            </a>
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">

          <div className="animate-fade-up delay-100">
            <FieldLabel>Jira URL</FieldLabel>
            <Input
              type="text"
              placeholder="company.atlassian.net"
              value={form.baseUrl}
              onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
              required
            />
          </div>

          <div className="animate-fade-up delay-200">
            <FieldLabel>Email</FieldLabel>
            <Input
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="animate-fade-up delay-300">
            <FieldLabel>API Token</FieldLabel>
            <Input
              type="password"
              placeholder="••••••••••••••••"
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              required
            />
          </div>

          {status === "error" && (
            <Alert variant="error" className="animate-fade-up py-2.5">
              ⚠ {errorMsg}
            </Alert>
          )}

          <div className="animate-fade-up delay-400 pt-2">
            <Button
              type="submit"
              variant="primary"
              disabled={status === "loading"}
              className="w-full py-3"
            >
              {status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Connecting...
                </span>
              ) : (
                <><LogIn size={14} />Connect</>
              )}
            </Button>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-8 text-center font-mono text-[0.65rem] text-[#3A3A3F] animate-fade-up">
          credentials stored locally · never leave your device
        </p>
      </div>
    </main>
  );
}

function Spinner() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="14 6" />
    </svg>
  );
}
