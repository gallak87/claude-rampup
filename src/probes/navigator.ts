import type { Finding, RiskLevel } from '../types/probe';

export function probeNavigator(): Finding[] {
  const nav = navigator;
  const findings: Finding[] = [];

  const add = (label: string, value: unknown, risk: RiskLevel, detail?: string) => {
    if (value !== undefined && value !== null && value !== '') {
      findings.push({ label, value: String(value), risk, detail });
    }
  };

  // User agent
  add('User Agent', nav.userAgent, 'medium',
    'Exposes browser, version, OS, and rendering engine');

  // Platform (deprecated but still populated everywhere)
  add('Platform', nav.platform, 'medium',
    'Deprecated API — still returns "MacIntel", "Win32", "Linux x86_64", etc.');

  // High-entropy UA data (Chromium only)
  const uaData = (nav as Navigator & { userAgentData?: { platform: string; mobile: boolean; brands: { brand: string; version: string }[] } }).userAgentData;
  if (uaData) {
    add('UA platform (high-entropy)', uaData.platform, 'medium');
    add('Mobile', String(uaData.mobile), 'low');
    add('UA brands', uaData.brands.map(b => `${b.brand}/${b.version}`).join(', '), 'low');
  }

  // Hardware
  add('CPU threads', nav.hardwareConcurrency, 'medium',
    'Narrows device to specific CPU tier (e.g. 8 = Apple M-series, Intel 12th gen+)');
  add('Device memory (GB)', nav.deviceMemory, 'medium',
    'Rounded to nearest bucket: 0.25, 0.5, 1, 2, 4, 8');

  // Screen
  add('Screen resolution', `${screen.width}×${screen.height}`, 'medium');
  add('Device pixel ratio', window.devicePixelRatio, 'medium',
    'Reveals HiDPI/Retina display — narrows to device class');
  add('Color depth', `${screen.colorDepth}-bit`, 'low');
  add('Available screen', `${screen.availWidth}×${screen.availHeight}`, 'low',
    'Available area reveals taskbar/dock size');

  // Locale
  add('Timezone', Intl.DateTimeFormat().resolvedOptions().timeZone, 'high',
    'Cross-referenced with IP geolocation — timezone mismatch reveals VPN use');
  add('Locale', Intl.DateTimeFormat().resolvedOptions().locale, 'low');
  add('Languages', nav.languages.join(', '), 'medium',
    'Primary language and fallbacks — combined with timezone creates geo fingerprint');

  // Network (Chromium only)
  const conn = nav.connection;
  if (conn) {
    add('Network type', conn.effectiveType, 'medium',
      'Effective connection type: 4g, 3g, 2g, slow-2g');
    add('RTT estimate (ms)', conn.rtt, 'low');
    add('Downlink (Mbps)', conn.downlink, 'low');
    if (conn.saveData !== undefined) {
      add('Data saver', conn.saveData, 'info');
    }
  }

  // Privacy signals (ironic — DNT users are rarer → more identifiable)
  const dnt = nav.doNotTrack;
  add('Do Not Track',
    dnt === '1' ? 'enabled (ironic — rarer = more trackable)' : dnt === '0' ? 'disabled' : 'not set',
    dnt === '1' ? 'medium' : 'info',
    'DNT=1 users are a minority — the header itself is a fingerprinting vector');

  add('Cookies enabled', nav.cookieEnabled, 'info');
  add('Online', nav.onLine, 'info');

  // Plugin count (most browsers now report 0 or a fixed list for privacy)
  const pluginCount = nav.plugins?.length ?? 0;
  add('Plugins', pluginCount === 0 ? 'none (privacy-hardened or modern browser)' : `${pluginCount} plugins`, 'info');

  return findings;
}
