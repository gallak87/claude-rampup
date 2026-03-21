import type { ProbeResult } from '../../types/probe';

export function PortScanFindings({ probe }: { probe: ProbeResult }) {
  const open = probe.findings.filter(f => f.value.startsWith('OPEN'));
  const other = probe.findings.filter(f => !f.value.startsWith('OPEN'));

  return (
    <div className="findings">
      {open.length > 0 && (
        <div className="findings__section-label">Open ports ({open.length})</div>
      )}
      {open.map((f, i) => (
        <div key={i} className={`finding finding--${f.risk}`}>
          <span className="finding__label">{f.label}</span>
          <span className="finding__value">{f.value}</span>
          {f.detail && <span className="finding__detail">{f.detail}</span>}
        </div>
      ))}
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
