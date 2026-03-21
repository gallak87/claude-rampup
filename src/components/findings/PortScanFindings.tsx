import { useState } from 'react';
import type { Finding, ProbeResult } from '../../types/probe';

function OpenPortFinding({ f }: { f: Finding }) {
  const [expanded, setExpanded] = useState(false);
  const hasHeaders = f.headers !== undefined;

  return (
    <div className={`finding finding--${f.risk}`}>
      <span className="finding__label">{f.label}</span>
      <span className="finding__value">
        {f.value}
        {hasHeaders && (
          <button
            className={`headers-toggle ${expanded ? 'headers-toggle--open' : ''}`}
            onClick={() => setExpanded(v => !v)}
            title="Show response headers"
          >
            {expanded ? '▾ headers' : '› headers'}
          </button>
        )}
      </span>
      {f.detail && <span className="finding__detail">{f.detail}</span>}
      {expanded && f.headers && (
        <div className="headers-panel">
          {Object.entries(f.headers).map(([k, v]) => (
            <div key={k} className="headers-row">
              <span className="headers-row__key">{k}</span>
              <span className="headers-row__val">{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function PortScanFindings({ probe }: { probe: ProbeResult }) {
  const open = probe.findings.filter(f => f.value.startsWith('OPEN'));
  const other = probe.findings.filter(f => !f.value.startsWith('OPEN'));

  return (
    <div className="findings">
      {open.length > 0 && (
        <div className="findings__section-label">Open ports ({open.length})</div>
      )}
      {open.map((f, i) => <OpenPortFinding key={i} f={f} />)}
      {other.length > 0 && open.length > 0 && (
        <div className="findings__section-label">Other</div>
      )}
      {other.map((f, i) => (
        <div key={i} className={`finding finding--${f.risk}`}>
          <span className="finding__label">{f.label}</span>
          <span className="finding__value">{f.value}</span>
          {f.detail && <span className="finding__detail">{f.detail}</span>}
        </div>
      ))}
    </div>
  );
}
