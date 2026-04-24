const HISTORY_KEY = "mp-history";
const COUNT_KEY = "mp-prompt-count";
const MAX_HISTORY = 100;

function safeParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function loadHistory() {
  if (typeof window === "undefined") return [];
  return safeParse(localStorage.getItem(HISTORY_KEY), []);
}

export function saveHistory(list) {
  if (typeof window === "undefined") return;
  const capped = list.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(capped));
}

export function addToHistory(entry) {
  const list = loadHistory();
  // de-dupe by id
  const filtered = list.filter((x) => x.id !== entry.id);
  const next = [entry, ...filtered].slice(0, MAX_HISTORY);
  saveHistory(next);
  return next;
}

export function removeFromHistory(id) {
  const next = loadHistory().filter((x) => x.id !== id);
  saveHistory(next);
  return next;
}

export function clearHistory() {
  saveHistory([]);
  return [];
}

export function updateHistoryItem(id, patch) {
  const next = loadHistory().map((x) => (x.id === id ? { ...x, ...patch } : x));
  saveHistory(next);
  return next;
}

export function loadPromptCount() {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(COUNT_KEY);
  const n = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function incrementPromptCount() {
  const next = loadPromptCount() + 1;
  localStorage.setItem(COUNT_KEY, String(next));
  return next;
}
