import { useState } from 'react';
import { ScanButton } from '../components/ScanButton';
import { Card } from '../components/Card';

type MechStatus = 'idle' | 'probing' | 'available' | 'empty' | 'blocked';

interface Entry { key: string; value: string; }

interface StorageMech {
  id: string;
  label: string;
  status: MechStatus;
  detail?: string;
  bytes?: number;
  entries?: Entry[];
}

interface QuotaInfo {
  usage: number;
  quota: number;
  persistent: boolean;
}

interface MapState {
  scanning: boolean;
  done: boolean;
  quota?: QuotaInfo;
  mechs: StorageMech[];
}

function formatBytes(n: number): string {
  if (n === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(n) / Math.log(1024)), units.length - 1);
  return `${(n / 1024 ** i).toFixed(1)} ${units[i]}`;
}

function collectStorage(s: Storage): { bytes: number; entries: Entry[] } {
  const entries: Entry[] = [];
  let bytes = 0;
  for (let i = 0; i < s.length; i++) {
    const key = s.key(i)!;
    const value = s.getItem(key) ?? '';
    bytes += (key.length + value.length) * 2;
    entries.push({ key, value: value.length > 80 ? value.slice(0, 80) + '…' : value });
  }
  return { bytes, entries };
}

const INITIAL_MECHS: StorageMech[] = [
  { id: 'localStorage',   label: 'localStorage',   status: 'idle' },
  { id: 'sessionStorage', label: 'sessionStorage',  status: 'idle' },
  { id: 'indexedDB',      label: 'IndexedDB',       status: 'idle' },
  { id: 'cookies',        label: 'Cookies',         status: 'idle' },
  { id: 'cacheAPI',       label: 'Cache API',       status: 'idle' },
  { id: 'opfs',           label: 'OPFS',            status: 'idle' },
  { id: 'persistence',    label: 'Persistence',     status: 'idle' },
];

const initialState: MapState = { scanning: false, done: false, mechs: INITIAL_MECHS };

export function StorageMap() {
  const [state, setState] = useState<MapState>(initialState);
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  function patchMech(id: string, patch: Partial<StorageMech>) {
    setState(s => ({ ...s, mechs: s.mechs.map(m => m.id === id ? { ...m, ...patch } : m) }));
  }

  function toggleOpen(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function runScan() {
    setState({ scanning: true, done: false, mechs: INITIAL_MECHS.map(m => ({ ...m, status: 'probing' })) });
    setOpenIds(new Set());

    let quotaInfo: QuotaInfo | undefined;

    await Promise.all([
      (async () => {
        try {
          const { bytes, entries } = collectStorage(localStorage);
          const n = entries.length;
          patchMech('localStorage', { status: n > 0 ? 'available' : 'empty', detail: `${n} key${n !== 1 ? 's' : ''}`, bytes, entries: n > 0 ? entries : undefined });
        } catch { patchMech('localStorage', { status: 'blocked' }); }
      })(),

      (async () => {
        try {
          const { bytes, entries } = collectStorage(sessionStorage);
          const n = entries.length;
          patchMech('sessionStorage', { status: n > 0 ? 'available' : 'empty', detail: `${n} key${n !== 1 ? 's' : ''}`, bytes, entries: n > 0 ? entries : undefined });
        } catch { patchMech('sessionStorage', { status: 'blocked' }); }
      })(),

      (async () => {
        try {
          const dbs = await indexedDB.databases();
          const n = dbs.length;
          const entries: Entry[] = dbs.map(db => ({ key: db.name ?? '(unnamed)', value: `v${db.version ?? '?'}` }));
          patchMech('indexedDB', { status: n > 0 ? 'available' : 'empty', detail: `${n} database${n !== 1 ? 's' : ''}`, entries: n > 0 ? entries : undefined });
        } catch { patchMech('indexedDB', { status: 'blocked' }); }
      })(),

      (async () => {
        try {
          const raw = document.cookie ? document.cookie.split(';').map(c => c.trim()).filter(Boolean) : [];
          const entries: Entry[] = raw.map(c => {
            const eq = c.indexOf('=');
            return eq === -1 ? { key: c, value: '' } : { key: c.slice(0, eq), value: c.slice(eq + 1, eq + 81) + (c.length - eq > 81 ? '…' : '') };
          });
          patchMech('cookies', { status: entries.length > 0 ? 'available' : 'empty', detail: `${entries.length} cookie${entries.length !== 1 ? 's' : ''}`, entries: entries.length > 0 ? entries : undefined });
        } catch { patchMech('cookies', { status: 'blocked' }); }
      })(),

      (async () => {
        try {
          const names = await caches.keys();
          const entries: Entry[] = await Promise.all(
            names.map(async name => {
              const cache = await caches.open(name);
              const keys = await cache.keys();
              return { key: name, value: `${keys.length} request${keys.length !== 1 ? 's' : ''}` };
            })
          );
          patchMech('cacheAPI', { status: entries.length > 0 ? 'available' : 'empty', detail: `${entries.length} cache${entries.length !== 1 ? 's' : ''}`, entries: entries.length > 0 ? entries : undefined });
        } catch { patchMech('cacheAPI', { status: 'blocked' }); }
      })(),

      (async () => {
        try {
          const dir = await navigator.storage.getDirectory();
          const entries: Entry[] = [];
          for await (const [name, handle] of (dir as unknown as AsyncIterable<[string, FileSystemHandle]>)) {
            entries.push({ key: name, value: handle.kind });
          }
          patchMech('opfs', { status: 'available', detail: entries.length > 0 ? `${entries.length} entr${entries.length !== 1 ? 'ies' : 'y'}` : 'accessible (empty)', entries: entries.length > 0 ? entries : undefined });
        } catch { patchMech('opfs', { status: 'blocked', detail: 'unavailable' }); }
      })(),

      (async () => {
        try {
          const [estimate, persistent] = await Promise.all([
            navigator.storage.estimate(),
            navigator.storage.persisted(),
          ]);
          patchMech('persistence', { status: persistent ? 'available' : 'empty', detail: persistent ? 'granted' : 'not granted' });
          quotaInfo = { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0, persistent };
        } catch { patchMech('persistence', { status: 'blocked' }); }
      })(),
    ]);

    setState(s => ({ ...s, scanning: false, done: true, quota: quotaInfo }));
  }

  const { scanning, done, quota, mechs } = state;
  const pct = quota ? Math.min(100, (quota.usage / quota.quota) * 100) : 0;

  return (
    <div className="storagemap">
      <div className="rendertrap__header">
        <p className="rendertrap__desc">
          maps every persistence vector this origin can use — quota, mechanisms, and what's claimed right now.
        </p>
        <ScanButton
          scanning={scanning}
          hasResults={done}
          onScan={runScan}
          onReset={() => { setState(initialState); setOpenIds(new Set()); }}
          label="MAP"
          scanningLabel="mapping…"
        />
      </div>

      {done && quota && (
        <Card className="storagemap__quota">
          <div className="storagemap__quota-header">
            <span className="storagemap__quota-label">storage quota</span>
            <span className="storagemap__quota-nums">
              {formatBytes(quota.usage)}
              <span className="storagemap__quota-sep"> / </span>
              {formatBytes(quota.quota)}
              <span className="storagemap__quota-pct"> ({pct < 0.01 ? '<0.01' : pct.toFixed(2)}%)</span>
            </span>
          </div>
          <div className="storagemap__bar-track">
            <div className="storagemap__bar-fill" style={{ width: `${pct}%` }} />
          </div>
          {quota.quota > 0 && quota.quota < 200 * 1024 * 1024 && (
            <span className="storagemap__quota-hint">↑ low quota — likely private / incognito mode</span>
          )}
        </Card>
      )}

      <Card className="storagemap__table">
        <div className="storagemap__row storagemap__row--head">
          <span>mechanism</span>
          <span>status</span>
          <span>detail</span>
          <span>size</span>
        </div>
        {mechs.map(m => {
          const isOpen = openIds.has(m.id);
          const hasEntries = !!m.entries?.length;
          return (
            <div key={m.id} className="storagemap__mech-wrap">
              <div
                className={`storagemap__row${hasEntries ? ' storagemap__row--expandable' : ''}`}
                onClick={() => hasEntries && toggleOpen(m.id)}
              >
                <span className="storagemap__mech-label">{m.label}</span>
                <span className="storagemap__mech-status">
                  <span className={`storagemap__dot storagemap__dot--${m.status}`} />
                  <span className={`storagemap__status-text storagemap__status-text--${m.status}`}>
                    {m.status === 'idle' ? '—' : m.status === 'probing' ? '…' : m.status}
                  </span>
                </span>
                <span className="storagemap__mech-detail">{m.detail ?? '—'}</span>
                <span className="storagemap__mech-bytes">
                  {hasEntries
                    ? <span className="storagemap__toggle">{isOpen ? '▲' : '▼'}</span>
                    : m.bytes != null ? formatBytes(m.bytes) : '—'
                  }
                </span>
              </div>
              {isOpen && m.entries && (
                <div className="storagemap__entries">
                  {m.entries.map((e, i) => (
                    <div key={i} className="storagemap__entry">
                      <span className="storagemap__entry-key">{e.key}</span>
                      <span className="storagemap__entry-value">{e.value || <em className="storagemap__entry-empty">(empty)</em>}</span>
                    </div>
                  ))}
                  {(m.id === 'localStorage' || m.id === 'sessionStorage') && (
                    <p className="storagemap__entries-note">content scripts share this origin — extension data appears here too</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
