// ── AEGIS Project Storage (IndexedDB) ────────────────────────────────────
// localStorage 대비 용량 제한 없음, 큰 Context 배열 안전 보관

import { Context, BattleFieldInput } from '../context';

export interface AegisProject {
  id: string;
  name: string;
  battleInput: BattleFieldInput;
  contexts: Context[];
  cepCount: number;
  savedAt: string;
}

const DB_NAME    = 'aegis_db';
const DB_VERSION = 1;
const STORE_NAME = 'projects';
const MAX_PROJECTS = 15;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('savedAt', 'savedAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

export async function saveProject(
  battleInput: BattleFieldInput,
  contexts: Context[],
  name?: string,
): Promise<AegisProject> {
  const db = await openDb();
  const project: AegisProject = {
    id:         `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name:       name?.trim() || `${battleInput.category} 분석`,
    battleInput,
    contexts,
    cepCount:   contexts.length,
    savedAt:    new Date().toISOString(),
  };

  await new Promise<void>((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(project);
    tx.oncomplete = () => resolve();
    tx.onerror    = () => reject(tx.error);
  });

  // MAX_PROJECTS 초과 시 오래된 것 삭제
  const all = await loadProjects();
  if (all.length > MAX_PROJECTS) {
    const toDelete = all.slice(MAX_PROJECTS);
    await Promise.all(toDelete.map(p => deleteProject(p.id)));
  }

  db.close();
  return project;
}

export async function loadProjects(): Promise<AegisProject[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.getAll();
    req.onsuccess = () => {
      const all = (req.result as AegisProject[])
        .filter(p => p.id !== '__auto__')           // 자동 저장 항목 제외
        .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      db.close();
      resolve(all);
    };
    req.onerror = () => { db.close(); reject(req.error); };
  });
}

// ── 마지막 세션 자동 저장 / 불러오기 ──────────────────────────────────────
export async function saveLastSession(
  battleInput: BattleFieldInput,
  contexts: Context[],
): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put({
      id: '__auto__',
      name: `[자동] ${battleInput.category} 분석`,
      battleInput,
      contexts,
      cepCount:  contexts.length,
      savedAt:   new Date().toISOString(),
    } satisfies AegisProject);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error); };
  });
}

export async function loadLastSession(): Promise<AegisProject | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req   = store.get('__auto__');
    req.onsuccess = () => { db.close(); resolve((req.result as AegisProject) ?? null); };
    req.onerror   = () => { db.close(); reject(req.error); };
  });
}

export async function deleteProject(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx    = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error); };
  });
}

export function formatProjectDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
}
