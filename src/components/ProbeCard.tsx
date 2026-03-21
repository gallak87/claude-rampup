import type { ProbeId, ProbeResult, RiskLevel } from '../types/probe';
import { RISK_ORDER } from '../types/probe';
import { getSynopsis } from '../utils/synopsis';
import { WebRTCFindings } from './findings/WebRTCFindings';
import { PortScanFindings } from './findings/PortScanFindings';
import { FingerprintFindings } from './findings/FingerprintFindings';
import { NavigatorFindings } from './findings/NavigatorFindings';

const DESCRIPTIONS: Record<ProbeId, string> = {
  webrtc:      'RTCPeerConnection ICE candidates leak real IP — bypasses VPN/proxy',
  portScan:    'fetch() timing side-channel reveals open local services',
  fingerprint: 'Canvas, WebGL, AudioContext, font enumeration → unique identity',
  navigator:   'Browser APIs expose OS, hardware, locale, and network characteristics',
};

const FINDINGS_COMPONENTS: Record<ProbeId, React.ComponentType<{ probe: ProbeResult }>> = {
  webrtc:      WebRTCFindings,
  portScan:    PortScanFindings,
  fingerprint: FingerprintFindings,
  navigator:   NavigatorFindings,
};

function probeMaxRisk(probe: ProbeResult): RiskLevel {
  return probe.findings.reduce<RiskLevel>(
    (acc, f) => RISK_ORDER[f.risk] > RISK_ORDER[acc] ? f.risk : acc,
    'info'
  );
}

export function ProbeCard({ probe }: { probe: ProbeResult }) {
  const maxRisk = probeMaxRisk(probe);
  const FindingsComponent = FINDINGS_COMPONENTS[probe.id];
  const synopsis = getSynopsis(probe);

  return (
    <div className={`probe-card probe-card--${probe.status} probe-card--${maxRisk}`}>
      <div className="probe-card__header">
        <div className="probe-card__title-row">
          <span className="probe-card__status-dot" />
          <span className="probe-card__title">{probe.label}</span>
          {probe.status === 'done' && (
            <span className={`risk-badge risk-badge--${maxRisk}`}>{maxRisk}</span>
          )}
          {probe.status === 'running' && (
            <span className="probe-card__spinner" />
          )}
        </div>
        <p className="probe-card__desc">{DESCRIPTIONS[probe.id]}</p>
        {probe.durationMs !== undefined && (
          <span className="probe-card__duration">{probe.durationMs}ms</span>
        )}
      </div>

      {probe.status === 'idle' && (
        <p className="probe-card__idle">Awaiting scan…</p>
      )}

      {probe.status === 'running' && (
        <p className="probe-card__running">Probing…</p>
      )}

      {probe.status === 'error' && (
        <p className="probe-card__error">Error: {probe.error}</p>
      )}

      {synopsis && (
        <p className={`probe-card__synopsis probe-card__synopsis--${maxRisk}`}>{synopsis}</p>
      )}

      {probe.status === 'done' && (
        <FindingsComponent probe={probe} />
      )}
    </div>
  );
}
