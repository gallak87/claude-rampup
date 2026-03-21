export type RiskLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

export const RISK_SCORE: Record<RiskLevel, number> = {
  info:     0,
  low:      10,
  medium:   25,
  high:     50,
  critical: 100,
};

export const RISK_ORDER: Record<RiskLevel, number> = {
  info:     0,
  low:      1,
  medium:   2,
  high:     3,
  critical: 4,
};

export interface Finding {
  label: string;
  value: string;
  risk: RiskLevel;
  detail?: string;
  headers?: Record<string, string>;
}

export type ProbeStatus = 'idle' | 'running' | 'done' | 'error';

export type ProbeId = 'webrtc' | 'portScan' | 'fingerprint' | 'navigator';

export interface ProbeResult {
  id: ProbeId;
  label: string;
  description: string;
  status: ProbeStatus;
  findings: Finding[];
  error?: string;
  durationMs?: number;
}

export type ScanAction =
  | { type: 'SCAN_START' }
  | { type: 'PROBE_DONE'; probeId: ProbeId; findings: Finding[]; durationMs: number }
  | { type: 'PROBE_ERROR'; probeId: ProbeId; error: string }
  | { type: 'SCAN_RESET' };

export interface ScanState {
  scanning: boolean;
  probes: Record<ProbeId, ProbeResult>;
}
