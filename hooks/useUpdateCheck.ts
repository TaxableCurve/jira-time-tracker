"use client";

import { useEffect, useState } from "react";

interface UpdateInfo {
  hasUpdate: boolean;
  latestVersion: string | null;
}

function semverGt(a: string, b: string): boolean {
  const parse = (v: string) => v.replace(/^v/, "").split(".").map(Number);
  const [aMajor, aMinor, aPatch] = parse(a);
  const [bMajor, bMinor, bPatch] = parse(b);
  if (aMajor !== bMajor) return aMajor > bMajor;
  if (aMinor !== bMinor) return aMinor > bMinor;
  return aPatch > bPatch;
}

export function useUpdateCheck(): UpdateInfo {
  const [info, setInfo] = useState<UpdateInfo>({ hasUpdate: false, latestVersion: null });

  useEffect(() => {
    const current = process.env.NEXT_PUBLIC_APP_VERSION;
    if (!current) return;

    fetch("https://api.github.com/repos/TaxableCurve/jira-time-tracker/tags?per_page=1")
      .then((r) => r.json())
      .then((tags) => {
        const latest = tags?.[0]?.name as string | undefined;
        if (latest && semverGt(latest, current)) {
          setInfo({ hasUpdate: true, latestVersion: latest });
        }
      })
      .catch(() => {});
  }, []);

  return info;
}
