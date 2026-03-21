import { useState } from 'react';
import { ScanButton } from '../components/ScanButton';
import { Card } from '../components/Card';
import { EXTENSIONS, runSnitch } from '../probes/extensionSnitch';
import type { SnitchResult, DetectStatus } from '../probes/extensionSnitch';

const CATEGORY_ORDER = ['crypto', 'devtools', 'writing', 'privacy', 'password', 'shopping', 'utility'];

const CATEGORY_LABELS: Record<string, string> = {
  crypto:   'crypto / web3',
  devtools: 'dev tools',
  writing:  'writing',
  privacy:  'privacy',
  password: 'password managers',
  shopping: 'shopping',
  utility:  'utility',
};

const METHOD_LABEL: Record<string, string> = {
  global: 'window',
  dom:    'dom',
  war:    'url probe',
};

function initialResults(): SnitchResult[] {
  return EXTENSIONS.map(ext => ({
    name:     ext.name,
    category: ext.category,
    reveals:  ext.reveals,
    risk:     ext.risk,
    method:   ext.method,
    status:   'idle' as DetectStatus,
  }));
}

export function Snitch() {
  const [results, setResults] = useState<SnitchResult[]>(initialResults());
  const [scanning, setScanning] = useState(false);
  const [done, setDone] = useState(false);

  function patchResult(name: string, status: DetectStatus) {
    setResults(prev => prev.map(r => r.name === name ? { ...r, status } : r));
  }

  async function runScan() {
    setResults(prev => prev.map(r => ({ ...r, status: 'pending' as DetectStatus })));
    setDone(false);
    setScanning(true);
    await runSnitch(patchResult);
    setScanning(false);
    setDone(true);
  }

  const detectedCount = results.filter(r => r.status === 'detected').length;
  const skippedCount  = results.filter(r => r.status === 'skipped').length;
  const checkedCount  = results.filter(r => r.status !== 'pending').length;

  const byCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: results.filter(r => r.category === cat),
  }));

  return (
    <div className="snitch">
      <div className="rendertrap__header">
        <p className="rendertrap__desc">
          detects installed browser extensions without any permissions.
          three techniques: window global injection, DOM attribute markers,
          and resource URL probing (chrome-extension:// — Chromium only).
        </p>
        <div className="rendertrap__scan-wrap">
          <ScanButton
            scanning={scanning}
            hasResults={done}
            onScan={runScan}
            onReset={() => { setResults(initialResults()); setDone(false); }}
            label="SNITCH"
            scanningLabel="snitching…"
          />
          {done && (
            <span className="rendertrap__scan-hint">
              {detectedCount} detected · {checkedCount - skippedCount} checked
              {skippedCount > 0 ? ` · ${skippedCount} skipped (not Chromium)` : ''}
            </span>
          )}
        </div>
      </div>

      <Card className="snitch__table">
        {/* Header */}
        <div className="snitch__row snitch__row--head">
          <span>extension</span>
          <span>reveals</span>
          <span>method</span>
          <span>status</span>
        </div>

        {byCategory.map(({ cat, label, items }) => (
          <div key={cat} className="snitch__category">
            <div className="snitch__category-label">{label}</div>
            {items.map(r => (
              <div
                key={r.name}
                className={`snitch__row snitch__row--${r.status}`}
              >
                <span className="snitch__name">{r.name}</span>
                <span className="snitch__reveals">{r.reveals}</span>
                <span className={`snitch__method snitch__method--${r.method}`}>
                  {METHOD_LABEL[r.method]}
                </span>
                <span className="snitch__status">
                  {r.status === 'idle'    && null}
                  {r.status === 'pending'  && <span className="snitch__dot snitch__dot--pending" />}
                  {r.status === 'detected' && <><span className="snitch__dot snitch__dot--detected" /><span className="snitch__status-text snitch__status-text--detected">detected</span></>}
                  {r.status === 'clear'    && <><span className="snitch__dot snitch__dot--clear" /><span className="snitch__status-text">clear</span></>}
                  {r.status === 'skipped'  && <span className="snitch__status-text snitch__status-text--skipped">— non-chromium</span>}
                </span>
              </div>
            ))}
          </div>
        ))}
      </Card>
    </div>
  );
}
