export type Severity = 'LOW' | 'MED' | 'HIGH' | 'CRIT';

export interface ThreatEvent {
  id: string;
  srcLat: number;
  srcLng: number;
  dstLat: number;
  dstLng: number;
  srcIp: string;
  dstIp: string;
  type: string;
  severity: Severity;
  ts: Date;
}

const ATTACK_TYPES = [
  'SSH Brute Force',
  'RDP Scan',
  'SQL Injection',
  'DDoS Flood',
  'Port Scan',
  'C2 Beacon',
  'DNS Exfil',
  'Credential Stuffing',
  'Log4Shell',
  'Ransomware C2',
  'Zero-Day Exploit',
  'MITM Intercept',
];

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randIp() {
  return `${rand(1, 254)}.${rand(0, 255)}.${rand(0, 255)}.${rand(1, 254)}`;
}

function randomSeverity(): Severity {
  const r = Math.random();
  if (r < 0.4) return 'LOW';
  if (r < 0.7) return 'MED';
  if (r < 0.9) return 'HIGH';
  return 'CRIT';
}

export function severityColor(s: Severity): string {
  switch (s) {
    case 'LOW':  return '#5ab876';
    case 'MED':  return '#d4a017';
    case 'HIGH': return '#e06030';
    case 'CRIT': return '#cc2222';
  }
}

export function generateEvent(): ThreatEvent {
  return {
    id: crypto.randomUUID(),
    srcLat: (Math.random() - 0.5) * 160,
    srcLng: (Math.random() - 0.5) * 360,
    dstLat: (Math.random() - 0.5) * 160,
    dstLng: (Math.random() - 0.5) * 360,
    srcIp: randIp(),
    dstIp: randIp(),
    type: ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)],
    severity: randomSeverity(),
    ts: new Date(),
  };
}

export function fmtTime(d: Date) {
  return d.toTimeString().slice(0, 8);
}
