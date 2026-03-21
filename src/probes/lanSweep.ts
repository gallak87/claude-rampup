export interface LanHost {
  ip: string;
  status: 'idle' | 'scanning' | 'alive' | 'dead';
  ports?: { port: number; open: boolean; label: string }[];
}

function isPrivateIPv4(ip: string): boolean {
  return (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  );
}

async function getLocalIp(): Promise<string | null> {
  return new Promise((resolve) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    const found: string[] = [];
    const finish = (ip: string | null) => { pc.close(); resolve(ip); };
    const timeout = setTimeout(() => finish(found[0] ?? null), 5000);

    pc.onicecandidate = (event) => {
      if (!event.candidate) {
        clearTimeout(timeout);
        finish(found[0] ?? null);
        return;
      }
      const parts = event.candidate.candidate.split(' ');
      const ip = parts[4];
      const type = parts[7];
      if (type === 'host' && ip && !ip.includes(':') && !ip.endsWith('.local') && isPrivateIPv4(ip)) {
        if (!found.includes(ip)) found.push(ip);
      }
    };

    pc.createDataChannel('probe');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(() => { clearTimeout(timeout); finish(null); });
  });
}

export async function detectSubnet(): Promise<{ subnet: string; localIp: string; isGuess: boolean }> {
  const ip = await getLocalIp();
  if (ip) {
    const parts = ip.split('.');
    return { subnet: parts.slice(0, 3).join('.'), localIp: ip, isGuess: false };
  }
  return { subnet: '192.168.1', localIp: 'unknown', isGuess: true };
}

async function probeHostAlive(ip: string): Promise<boolean> {
  const start = performance.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 1500);
  try {
    await fetch(`http://${ip}`, { signal: ac.signal, mode: 'no-cors', cache: 'no-store' });
    clearTimeout(timer);
    return true;
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === 'AbortError') return false;
    return performance.now() - start < 500;
  }
}

const SERVICE_PORTS: { port: number; label: string }[] = [
  { port: 80,   label: 'HTTP'        },
  { port: 443,  label: 'HTTPS'       },
  { port: 8080, label: 'HTTP Alt'    },
  { port: 8443, label: 'HTTPS Alt'   },
  { port: 3000, label: 'Node / React' },
  { port: 5000, label: 'Python dev'  },
  { port: 9090, label: 'Prometheus'  },
];

async function probeServicePort(ip: string, port: number): Promise<boolean> {
  const start = performance.now();
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), 1500);
  try {
    await fetch(`http://${ip}:${port}`, { signal: ac.signal, mode: 'no-cors', cache: 'no-store' });
    clearTimeout(timer);
    return true;
  } catch (e) {
    clearTimeout(timer);
    if ((e as Error).name === 'AbortError') return false;
    return performance.now() - start < 300;
  }
}

export async function probeHostPorts(ip: string): Promise<{ port: number; open: boolean; label: string }[]> {
  return Promise.all(SERVICE_PORTS.map(async ({ port, label }) => ({
    port, label, open: await probeServicePort(ip, port),
  })));
}

export async function sweepSubnet(
  subnet: string,
  onUpdate: (lastOctet: number, status: 'scanning' | 'alive' | 'dead') => void,
): Promise<void> {
  const BATCH = 20;
  const octets = Array.from({ length: 254 }, (_, i) => i + 1);
  for (let i = 0; i < octets.length; i += BATCH) {
    await Promise.all(octets.slice(i, i + BATCH).map(async (octet) => {
      onUpdate(octet, 'scanning');
      const alive = await probeHostAlive(`${subnet}.${octet}`);
      onUpdate(octet, alive ? 'alive' : 'dead');
    }));
  }
}
