import type { Finding, RiskLevel } from '../types/probe';

interface PortSpec {
  port: number;
  service: string;
  risk: RiskLevel;
}

const TARGET_PORTS: PortSpec[] = [
  { port: 2375,  service: 'Docker daemon (unauth)',  risk: 'critical' },
  { port: 2376,  service: 'Docker daemon (TLS)',     risk: 'high'     },
  { port: 3306,  service: 'MySQL',                   risk: 'high'     },
  { port: 5432,  service: 'PostgreSQL',              risk: 'high'     },
  { port: 6379,  service: 'Redis',                   risk: 'high'     },
  { port: 27017, service: 'MongoDB',                 risk: 'high'     },
  { port: 9200,  service: 'Elasticsearch',           risk: 'high'     },
  { port: 5601,  service: 'Kibana',                  risk: 'high'     },
  { port: 11211, service: 'Memcached',               risk: 'high'     },
  { port: 8888,  service: 'Jupyter Notebook',        risk: 'high'     },
  { port: 8080,  service: 'HTTP Alt',                risk: 'medium'   },
  { port: 8443,  service: 'HTTPS Alt',               risk: 'medium'   },
  { port: 3000,  service: 'Node.js / React dev',     risk: 'low'      },
  { port: 4200,  service: 'Angular dev',             risk: 'low'      },
  { port: 5000,  service: 'Flask / Python dev',      risk: 'low'      },
  { port: 5173,  service: 'Vite dev',                risk: 'low'      },
  { port: 8000,  service: 'Python / Django dev',     risk: 'low'      },
];

// Chrome/Firefox hard-block these ports at the network layer
const BROWSER_BLOCKED_PORTS = new Set([
  1, 7, 9, 11, 13, 15, 17, 19, 20, 21, 22, 23, 25, 37, 42, 43, 53,
  69, 77, 79, 87, 95, 101, 102, 103, 104, 109, 110, 111, 115, 118,
  119, 123, 135, 139, 143, 161, 179, 389, 427, 465, 512, 513, 514,
  515, 526, 530, 531, 532, 540, 548, 554, 556, 563, 587, 601, 636,
  993, 995, 2049, 3659, 4045, 6000,
]);

type PortStatus = 'open' | 'closed' | 'timeout' | 'browser-blocked';

interface PortResult {
  port: number;
  service: string;
  risk: RiskLevel;
  status: PortStatus;
  latencyMs: number;
}

async function probePort(spec: PortSpec): Promise<PortResult> {
  if (BROWSER_BLOCKED_PORTS.has(spec.port)) {
    return { ...spec, status: 'browser-blocked', latencyMs: 0 };
  }

  const start = performance.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 1500);

  try {
    await fetch(`http://127.0.0.1:${spec.port}`, {
      signal: ac.signal,
      mode: 'no-cors',
      cache: 'no-store',
    });
    clearTimeout(timer);
    return { ...spec, status: 'open', latencyMs: Math.round(performance.now() - start) };
  } catch (e) {
    clearTimeout(timer);
    const latencyMs = Math.round(performance.now() - start);

    if ((e as Error).name === 'AbortError') {
      return { ...spec, status: 'timeout', latencyMs };
    }
    // Fast network error = RST (closed) or protocol rejection from open non-HTTP service
    // Both are "interesting" if fast — closed ports refuse immediately, open non-HTTP services too
    // We can't distinguish without raw sockets, so report latency for transparency
    return { ...spec, status: latencyMs < 300 ? 'closed' : 'timeout', latencyMs };
  }
}

export async function probePortScan(
  onProgress?: (result: PortResult) => void
): Promise<Finding[]> {
  if (location.protocol === 'https:') {
    return [{
      label: 'Mixed content blocked',
      value: 'Port scan unavailable over HTTPS',
      risk: 'info',
      detail: 'Browsers block http:// fetches from https:// pages. Run locally over http:// to enable.',
    }];
  }

  const results = await Promise.allSettled(
    TARGET_PORTS.map(async spec => {
      const result = await probePort(spec);
      onProgress?.(result);
      return result;
    })
  );

  const findings: Finding[] = [];

  for (const settled of results) {
    if (settled.status === 'rejected') continue;
    const r = settled.value;

    if (r.status === 'open') {
      findings.push({
        label: `${r.port} — ${r.service}`,
        value: `OPEN (${r.latencyMs}ms)`,
        risk: r.risk,
        detail: `Responding on http://127.0.0.1:${r.port}`,
      });
    } else if (r.status === 'timeout') {
      findings.push({
        label: `${r.port} — ${r.service}`,
        value: `FILTERED (timeout)`,
        risk: 'low',
        detail: 'No response within 1.5s — firewall drop or non-HTTP service',
      });
    } else if (r.status === 'browser-blocked') {
      findings.push({
        label: `${r.port} — ${r.service}`,
        value: 'BROWSER-BLOCKED',
        risk: 'info',
        detail: 'Browser security policy blocks this port — result inconclusive',
      });
    }
    // closed = no finding (expected, not interesting)
  }

  const openCount = findings.filter(f => f.value.startsWith('OPEN')).length;
  if (openCount === 0 && findings.every(f => f.risk === 'info')) {
    findings.unshift({
      label: 'No open ports detected',
      value: `${TARGET_PORTS.length} ports scanned`,
      risk: 'info',
    });
  }

  return findings;
}
