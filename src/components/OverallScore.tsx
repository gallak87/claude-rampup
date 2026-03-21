import type { ProbeId, ProbeResult, RiskLevel } from '../types/probe';
import { RISK_SCORE } from '../types/probe';

function computeScore(probes: Record<ProbeId, ProbeResult>): number {
  let total = 0;
  let count = 0;
  for (const probe of Object.values(probes)) {
    for (const finding of probe.findings) {
      total += RISK_SCORE[finding.risk];
      count++;
    }
  }
  if (count === 0) return 0;
  return Math.min(100, Math.round((total / count / RISK_SCORE.critical) * 100));
}

function scoreToLevel(score: number): { level: RiskLevel; label: string } {
  if (score >= 70) return { level: 'critical', label: 'CRITICAL EXPOSURE' };
  if (score >= 50) return { level: 'high',     label: 'HIGH EXPOSURE' };
  if (score >= 30) return { level: 'medium',   label: 'MODERATE EXPOSURE' };
  if (score >= 10) return { level: 'low',      label: 'LOW EXPOSURE' };
  return            { level: 'info',    label: 'MINIMAL EXPOSURE' };
}

interface OverallScoreProps {
  probes: Record<ProbeId, ProbeResult>;
}

export function OverallScore({ probes }: OverallScoreProps) {
  const allDone = Object.values(probes).every(
    p => p.status === 'done' || p.status === 'error'
  );
  const anyStarted = Object.values(probes).some(p => p.status !== 'idle');
  if (!anyStarted || !allDone) return null;

  const score = computeScore(probes);
  const { level, label } = scoreToLevel(score);

  return (
    <div className={`overall-score overall-score--${level}`}>
      <div className="overall-score__number">{score}</div>
      <div className="overall-score__meta">
        <span className="overall-score__label">{label}</span>
        <span className="overall-score__sub">exposure score / 100</span>
      </div>
    </div>
  );
}
