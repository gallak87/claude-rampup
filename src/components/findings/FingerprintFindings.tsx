import type { ProbeResult } from '../../types/probe';

export function FingerprintFindings({ probe }: { probe: ProbeResult }) {
  return (
    <div className="findings">
      {probe.findings.map((f, i) => (
        <div key={i} className={`finding finding--${f.risk}`}>
          <span className="finding__label">{f.label}</span>
          <span className="finding__value finding__value--mono">{f.value}</span>
          {f.detail && <span className="finding__detail">{f.detail}</span>}
        </div>
      ))}
    </div>
  );
}
