import { probeWebRTC } from './webrtc';

export interface GeoResult {
  country: string;
  countryCode: string;
  regionName: string;
  city: string;
  isp: string;
  org: string;
  as: string;
}

// ip-api.com free tier is HTTP-only — blocked from HTTPS pages
export function geoAvailable(): boolean {
  return location.protocol !== 'https:';
}

export async function fetchGeo(ip: string): Promise<GeoResult | null> {
  if (!geoAvailable()) return null;
  try {
    const res = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,country,countryCode,regionName,city,isp,org,as`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json() as { status: string } & GeoResult;
    return data.status === 'success' ? data : null;
  } catch {
    return null;
  }
}

export async function fetchRdns(ip: string): Promise<string | null> {
  if (ip.includes(':')) return null; // skip IPv6 rDNS
  try {
    const reversed = ip.split('.').reverse().join('.') + '.in-addr.arpa';
    const res = await fetch(
      `https://dns.google/resolve?name=${encodeURIComponent(reversed)}&type=PTR`,
      { cache: 'no-store' }
    );
    if (!res.ok) return null;
    const data = await res.json() as { Answer?: { data: string }[] };
    const answer = data.Answer?.[0]?.data;
    return answer ? answer.replace(/\.$/, '') : null;
  } catch {
    return null;
  }
}

export async function getWebRTCIps(): Promise<{ publicIps: string[]; localIps: string[] }> {
  const findings = await probeWebRTC();
  return {
    publicIps: findings
      .filter(f => f.label === 'Public IP (VPN leak)' || f.label === 'IPv6 address')
      .map(f => f.value),
    localIps: findings
      .filter(f => f.label === 'LAN IP')
      .map(f => f.value),
  };
}
