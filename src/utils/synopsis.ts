import type { ProbeResult } from '../types/probe';

export function getSynopsis(probe: ProbeResult): string | null {
  if (probe.status !== 'done' || probe.findings.length === 0) return null;

  switch (probe.id) {
    case 'webrtc': return webrtcSynopsis(probe);
    case 'portScan': return portScanSynopsis(probe);
    case 'fingerprint': return fingerprintSynopsis(probe);
    case 'navigator': return navigatorSynopsis(probe);
  }
}

function webrtcSynopsis(probe: ProbeResult): string {
  const publicIPs = probe.findings.filter(f => f.label === 'Public IP (VPN leak)');
  const ipv6 = probe.findings.filter(f => f.label === 'IPv6 address');
  const lan = probe.findings.filter(f => f.label === 'LAN IP');
  const mdns = probe.findings.filter(f => f.label === 'mDNS host (obfuscated)');

  if (publicIPs.length > 0) {
    const ip = publicIPs[0].value;
    const extra = ipv6.length > 0 ? ' IPv6 is also leaking, which most VPNs don\'t tunnel.' : '';
    return `Your real public IP (${ip}) is visible to any site via WebRTC — no request needed, no permissions asked. This bypasses VPN and proxy entirely.${extra}`;
  }
  if (ipv6.length > 0) {
    return `Your IPv6 address is leaking. Most VPNs only tunnel IPv4, leaving IPv6 directly attributable to you — and IPv6 addresses often map precisely to your ISP and location.`;
  }
  if (lan.length > 0) {
    const ips = lan.map(f => f.value).join(', ');
    return `Your LAN address (${ips}) is exposed. This reveals your internal network structure and can be used to fingerprint your router or probe local services.`;
  }
  if (mdns.length > 0) {
    return `Chrome partially obfuscated your LAN IP with mDNS, but ICE candidates still confirm your network topology. Other browsers may expose the raw IP.`;
  }
  return `No IP addresses leaked via WebRTC. Your browser may have ICE candidate gathering restricted, or you have no relevant network interfaces.`;
}

function portScanSynopsis(probe: ProbeResult): string {
  if (probe.findings.some(f => f.value === 'Port scan unavailable over HTTPS')) {
    return `Browser mixed-content policy blocked the scan — fetch() to http:// is disallowed from an https:// page. Run locally to enable.`;
  }

  const open = probe.findings.filter(f => f.value.startsWith('OPEN'));
  if (open.length === 0) {
    return `No open ports detected. Local databases and services aren't reachable via browser-side JavaScript on this machine.`;
  }

  const critical = open.filter(f => f.risk === 'critical');
  const high = open.filter(f => f.risk === 'high');
  const low = open.filter(f => f.risk === 'low');

  if (critical.length > 0) {
    const names = critical.map(f => f.label.split('—')[1]?.trim()).join(', ');
    return `${names} detected — this is severe. A malicious page could interact with ${names} directly from JavaScript, with no authentication required in default configs.`;
  }
  if (high.length > 0) {
    const names = high.map(f => f.label.split('—')[1]?.trim()).join(', ');
    return `${names} open on localhost. These services are reachable from any browser tab — a drive-by script could query or modify data without your knowledge.`;
  }
  if (low.length === open.length) {
    const names = low.map(f => f.label.split('—')[1]?.trim()).join(', ');
    return `Dev server(s) open (${names}). Low risk in isolation, but hot-reload endpoints and build APIs can leak source code to scripts running on the same machine.`;
  }
  return `${open.length} open port${open.length > 1 ? 's' : ''} detected. Any browser tab on this machine can reach these services — cross-origin restrictions don't protect localhost.`;
}

function fingerprintSynopsis(probe: ProbeResult): string {
  const entropyFinding = probe.findings.find(f => f.label === 'Entropy estimate');
  const webglRenderer = probe.findings.find(f => f.label === 'WebGL renderer');
  const fonts = probe.findings.find(f => f.label?.startsWith('Fonts detected'));

  if (!entropyFinding) return `Fingerprinting complete. Your browser leaks enough rendering and hardware data to be tracked across sites without cookies.`;

  const masked = webglRenderer?.value.includes('masked');
  const entropyBits = parseFloat(entropyFinding.value);

  if (entropyBits >= 18) {
    const driver = !masked && webglRenderer ? ` Your GPU (${webglRenderer.value}) alone is a strong identifier.` : '';
    return `Highly unique fingerprint.${driver} You can likely be re-identified across sites without any cookies or login — purely from how your browser renders graphics and text.`;
  }
  if (entropyBits >= 10) {
    const fontCount = fonts ? fonts.label.match(/\d+/)?.[0] : null;
    const fontNote = fontCount ? ` ${fontCount} installed fonts contribute significantly.` : '';
    return `Moderate fingerprint entropy — you're identifiable within a fairly small group.${fontNote} Combined with IP or behavioral signals, re-identification is likely.`;
  }
  if (masked) {
    return `Low entropy — your browser appears to be resisting fingerprinting (Firefox resistFingerprinting or similar). WebGL renderer info was masked. Good.`;
  }
  return `Low fingerprint entropy. Your hardware/font combination is common enough to blend in with a larger crowd, which limits tracking effectiveness.`;
}

function navigatorSynopsis(probe: ProbeResult): string {
  const tz = probe.findings.find(f => f.label === 'Timezone')?.value;
  const memory = probe.findings.find(f => f.label === 'Device memory (GB)')?.value;
  const dnt = probe.findings.find(f => f.label === 'Do Not Track');
  const conn = probe.findings.find(f => f.label === 'Network type');
  const count = probe.findings.length;

  const dntIrony = dnt?.value.includes('ironic')
    ? `Notably, Do Not Track is enabled — but DNT users are a minority, making you *more* trackable, not less. `
    : '';

  const tzNote = tz ? `Your timezone (${tz})` : 'Your timezone';
  const memNote = memory ? ` combined with ${memory}GB device memory` : '';
  const connNote = conn ? ` and ${conn.value} network type` : '';

  return `${dntIrony}${count} browser properties exposed passively — no interaction required. ${tzNote}${memNote}${connNote} create a geo-hardware profile that persists across sessions, VPNs, and incognito mode.`;
}
