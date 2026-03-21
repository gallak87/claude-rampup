import type { Finding, RiskLevel } from '../types/probe';

interface ParsedIPs {
  publicIPs: string[];
  localIPs: string[];
  ipv6: string[];
  mdns: string[];
  raw: string[];
}

function isPrivateIPv4(ip: string): boolean {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip) ||
    ip === '127.0.0.1'
  );
}

function parseICECandidates(raw: string[]): ParsedIPs {
  const publicIPs: string[] = [];
  const localIPs: string[] = [];
  const ipv6: string[] = [];
  const mdns: string[] = [];

  for (const candidate of raw) {
    const parts = candidate.split(' ');
    const ip = parts[4];
    const type = parts[7];
    if (!ip) continue;

    // mDNS obfuscation (Chrome) — .local hostnames instead of real IPs
    if (ip.endsWith('.local')) {
      mdns.push(ip);
      continue;
    }

    // IPv6
    if (ip.includes(':')) {
      if (!ipv6.includes(ip)) ipv6.push(ip);
      continue;
    }

    if (type === 'srflx' || type === 'relay') {
      if (!publicIPs.includes(ip)) publicIPs.push(ip);
    } else if (type === 'host') {
      if (isPrivateIPv4(ip) && !localIPs.includes(ip)) localIPs.push(ip);
      else if (!isPrivateIPv4(ip) && !publicIPs.includes(ip)) publicIPs.push(ip);
    }
  }

  return { publicIPs, localIPs, ipv6, mdns, raw };
}

function ipsToFindings(parsed: ParsedIPs): Finding[] {
  const findings: Finding[] = [];

  for (const ip of parsed.publicIPs) {
    findings.push({
      label: 'Public IP (VPN leak)',
      value: ip,
      risk: 'high',
      detail: 'Exposed via STUN server-reflexive candidate — bypasses VPN tunnel',
    });
  }

  for (const ip of parsed.localIPs) {
    findings.push({
      label: 'LAN IP',
      value: ip,
      risk: 'medium',
      detail: 'Local network address exposed via host candidate',
    });
  }

  for (const ip of parsed.ipv6) {
    findings.push({
      label: 'IPv6 address',
      value: ip,
      risk: 'high',
      detail: 'IPv6 often bypasses VPN entirely — many VPNs only tunnel IPv4',
    });
  }

  for (const host of parsed.mdns) {
    findings.push({
      label: 'mDNS host (obfuscated)',
      value: host,
      risk: 'low',
      detail: 'Chrome hid the real LAN IP behind an mDNS hostname — partial leak',
    });
  }

  if (findings.length === 0) {
    findings.push({
      label: 'No IPs leaked',
      value: '—',
      risk: 'info',
      detail: 'WebRTC ICE gathering returned no usable candidates',
    });
  }

  return findings;
}

export async function probeWebRTC(): Promise<Finding[]> {
  return new Promise((resolve) => {
    const candidates: string[] = [];

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    });

    const finish = () => {
      pc.close();
      resolve(ipsToFindings(parseICECandidates(candidates)));
    };

    const timeout = setTimeout(finish, 6000);

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        candidates.push(event.candidate.candidate);
      } else {
        clearTimeout(timeout);
        finish();
      }
    };

    pc.createDataChannel('probe');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => { clearTimeout(timeout); finish(); });
  });
}

export function maxRisk(findings: Finding[]): RiskLevel {
  const order: Record<RiskLevel, number> = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
  return findings.reduce<RiskLevel>(
    (acc, f) => order[f.risk] > order[acc] ? f.risk : acc,
    'info'
  );
}
