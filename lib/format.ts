export function secondsToHuman(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function secondsToTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function humanToSeconds(input: string): number {
  const hours = input.match(/(\d+(\.\d+)?)\s*h/);
  const mins = input.match(/(\d+)\s*m/);
  const h = hours ? parseFloat(hours[1]) : 0;
  const m = mins ? parseInt(mins[1]) : 0;
  return Math.round(h * 3600 + m * 60);
}

export function isoToJira(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const tz = -date.getTimezoneOffset();
  const sign = tz >= 0 ? "+" : "-";
  const abstz = Math.abs(tz);
  const tzStr = `${sign}${pad(Math.floor(abstz / 60))}${pad(abstz % 60)}`;
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:00.000${tzStr}`;
}
