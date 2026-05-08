import { useState, useEffect } from "react";

export interface JiraConfig {
  baseUrl: string;
  email: string;
  token: string;
  accountId: string;
}

interface ElectronBridge {
  config: {
    get: () => Promise<string | null>;
    set: (data: string) => Promise<void>;
    clear: () => Promise<void>;
  };
}

declare global {
  interface Window {
    electronApp?: ElectronBridge;
  }
}

const STORAGE_KEY = "jira_config";

function isElectron(): boolean {
  return typeof window !== "undefined" && !!window.electronApp?.config;
}

export async function getConfig(): Promise<JiraConfig | null> {
  if (typeof window === "undefined") return null;
  try {
    const raw = isElectron()
      ? await window.electronApp!.config.get()
      : localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as JiraConfig;
  } catch {
    return null;
  }
}

export async function saveConfig(config: JiraConfig): Promise<void> {
  const raw = JSON.stringify(config);
  if (isElectron()) {
    await window.electronApp!.config.set(raw);
  } else {
    localStorage.setItem(STORAGE_KEY, raw);
  }
}

export async function clearConfig(): Promise<void> {
  if (isElectron()) {
    await window.electronApp!.config.clear();
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useConfig() {
  const [config, setConfig] = useState<JiraConfig | null>(null);
  useEffect(() => {
    getConfig().then(setConfig);
  }, []);
  return config;
}

export function configHeaders(config: JiraConfig): Record<string, string> {
  return {
    "X-Jira-Base-Url": config.baseUrl,
    "X-Jira-Email": config.email,
    "X-Jira-Token": config.token,
  };
}
