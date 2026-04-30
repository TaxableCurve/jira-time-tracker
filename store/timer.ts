import { create } from "zustand";

interface TimerState {
  issueKey: string | null;
  issueName: string | null;
  startTime: number | null;
  isRunning: boolean;
  start: (issueKey: string, issueName: string) => void;
  stop: () => { issueKey: string; issueName: string; startTime: number; durationSeconds: number } | null;
  clear: () => void;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  issueKey: null,
  issueName: null,
  startTime: null,
  isRunning: false,

  start: (issueKey, issueName) => {
    set({ issueKey, issueName, startTime: Date.now(), isRunning: true });
  },

  stop: () => {
    const { issueKey, issueName, startTime, isRunning } = get();
    if (!isRunning || !issueKey || !issueName || !startTime) return null;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    set({ issueKey: null, issueName: null, startTime: null, isRunning: false });
    return { issueKey, issueName, startTime, durationSeconds };
  },

  clear: () => set({ issueKey: null, issueName: null, startTime: null, isRunning: false }),
}));
