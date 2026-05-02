
// ── AEGIS Temporal Snapshot Storage ──────────────────────────────────────
// Stores CEP analysis results in localStorage for temporal comparison.

import { Context } from '../context';
import { AnalysisPeriod } from '../search/analysisPeriod.types';
import { DateRange } from '../search/config';

export interface ContextSnapshot {
  id: string;
  name: string;
  category: string;
  ceps: Context[];
  period: AnalysisPeriod | null;
  dateRange: DateRange | null;
  periodLabel: string;
  createdAt: string;
  cepCount: number;
}

const STORAGE_KEY = 'aegis_cep_snapshots';
const MAX_SNAPSHOTS = 20;

function loadAll(): ContextSnapshot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ContextSnapshot[]) : [];
  } catch {
    return [];
  }
}

function saveAll(snapshots: ContextSnapshot[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshots));
  } catch (e) {
    console.warn('AEGIS Snapshot: localStorage write failed', e);
  }
}

export function saveSnapshot(
  name: string,
  category: string,
  ceps: Context[],
  periodLabel: string,
  period: AnalysisPeriod | null = null,
  dateRange: DateRange | null = null,
): ContextSnapshot {
  const snapshot: ContextSnapshot = {
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name || `${category} — ${periodLabel}`,
    category,
    ceps,
    period,
    dateRange,
    periodLabel,
    createdAt: new Date().toISOString(),
    cepCount: ceps.length,
  };

  const existing = loadAll();
  const updated = [snapshot, ...existing].slice(0, MAX_SNAPSHOTS);
  saveAll(updated);
  return snapshot;
}

export function loadSnapshots(): ContextSnapshot[] {
  return loadAll().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export function getSnapshot(id: string): ContextSnapshot | null {
  return loadAll().find(s => s.id === id) ?? null;
}

export function deleteSnapshot(id: string): void {
  saveAll(loadAll().filter(s => s.id !== id));
}

export function formatSnapshotDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
