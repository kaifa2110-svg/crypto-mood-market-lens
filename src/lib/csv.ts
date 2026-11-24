/** Builds RFC 4180 CSV text; cells with commas, quotes or newlines are quoted. */
export function toCsv(rows: (string | number)[][]): string {
  return rows
    .map((r) => r.map((v) => {
      const s = typeof v === "number" ? (Number.isFinite(v) ? String(v) : "") : v;
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    }).join(","))
    .join("\r\n");
}

export function downloadCsv(rows: (string | number)[][], filename: string) {
  const blob = new Blob(["\uFEFF" + toCsv(rows)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export const LOCK_EVENT = "cmc-pulse:lock-now";
