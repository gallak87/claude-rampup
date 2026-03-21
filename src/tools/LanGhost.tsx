import { useState } from 'react';
import { ScanButton } from '../components/ScanButton';
import { Card } from '../components/Card';
import { detectSubnet, sweepSubnet, probeHostPorts } from '../probes/lanSweep';
import type { LanHost } from '../probes/lanSweep';

type Phase = 'idle' | 'detecting' | 'sweeping' | 'probing' | 'done';

interface LanState {
  phase: Phase;
  subnet: string;
  localIp: string;
  isGuess: boolean;
  hosts: LanHost[];
}

const EMPTY_HOSTS: LanHost[] = Array.from({ length: 254 }, (_, i) => ({
  ip: `?.?.?.${i + 1}`,
  status: 'idle',
}));

const initialState: LanState = {
  phase: 'idle',
  subnet: '',
  localIp: '',
  isGuess: false,
  hosts: EMPTY_HOSTS,
};

export function LanGhost() {
  const [state, setState] = useState<LanState>(initialState);
  const [openIps, setOpenIps] = useState<Set<string>>(new Set());

  function toggleOpen(ip: string) {
    setOpenIps(prev => {
      const next = new Set(prev);
      next.has(ip) ? next.delete(ip) : next.add(ip);
      return next;
    });
  }

  async function runScan() {
    setState({ phase: 'detecting', subnet: '', localIp: '', isGuess: false, hosts: EMPTY_HOSTS });
    setOpenIps(new Set());

    const { subnet, localIp, isGuess } = await detectSubnet();

    setState(s => ({
      ...s,
      phase: 'sweeping',
      subnet,
      localIp,
      isGuess,
      hosts: Array.from({ length: 254 }, (_, i) => ({
        ip: `${subnet}.${i + 1}`,
        status: 'idle' as const,
      })),
    }));

    const aliveOctets: number[] = [];

    await sweepSubnet(subnet, (lastOctet, status) => {
      if (status === 'alive') aliveOctets.push(lastOctet);
      setState(s => {
        const hosts = [...s.hosts];
        hosts[lastOctet - 1] = { ...hosts[lastOctet - 1], status };
        return { ...s, hosts };
      });
    });

    setState(s => ({ ...s, phase: 'probing' }));

    await Promise.all(aliveOctets.map(async (octet) => {
      const ip = `${subnet}.${octet}`;
      const ports = await probeHostPorts(ip);
      setState(s => {
        const hosts = [...s.hosts];
        hosts[octet - 1] = { ...hosts[octet - 1], ports };
        return { ...s, hosts };
      });
    }));

    setState(s => ({ ...s, phase: 'done' }));
  }

  const { phase, subnet, localIp, isGuess, hosts } = state;
  const scanning = phase !== 'idle' && phase !== 'done';
  const aliveHosts = hosts.filter(h => h.status === 'alive');
  const scannedCount = hosts.filter(h => h.status !== 'idle').length;

  const scanningLabel =
    phase === 'detecting' ? 'detecting…' :
    phase === 'sweeping'  ? `sweeping… ${scannedCount}/254` :
    'probing services…';

  return (
    <div className="langhost">
      <div className="rendertrap__header">
        <p className="rendertrap__desc">
          maps your local network from a browser tab — no extensions, no permissions.
          fetch() timing reveals which hosts are alive.
        </p>
        <ScanButton
          scanning={scanning}
          hasResults={phase === 'done'}
          onScan={runScan}
          onReset={() => { setState(initialState); setOpenIps(new Set()); }}
          label="SWEEP"
          scanningLabel={scanningLabel}
        />
      </div>

      {phase !== 'idle' && (
        <>
          <div className="langhost__meta">
            {subnet && (
              <span className="langhost__meta-item">
                subnet <span className="langhost__meta-value">{subnet}.0/24</span>
              </span>
            )}
            {localIp && localIp !== 'unknown' && (
              <span className="langhost__meta-item">
                local ip <span className="langhost__meta-value">{localIp}</span>
              </span>
            )}
            {isGuess && (
              <span className="langhost__meta-guess">guessed subnet — webrtc returned mDNS only</span>
            )}
            {aliveHosts.length > 0 && (
              <span className="langhost__meta-item">
                alive <span className="langhost__meta-value langhost__meta-value--accent">{aliveHosts.length}</span>
              </span>
            )}
          </div>

          <Card className="langhost__grid-card">
            <div className="langhost__grid">
              {hosts.map((host) => (
                <div
                  key={host.ip}
                  className={`langhost__cell langhost__cell--${host.status}`}
                  title={host.ip}
                />
              ))}
              <div className="langhost__cell langhost__cell--spacer" />
              <div className="langhost__cell langhost__cell--spacer" />
            </div>
          </Card>

          {aliveHosts.length > 0 && (
            <Card className="langhost__hosts">
              <div className="langhost__hosts-header">
                <span>host</span>
                <span>services</span>
              </div>
              {aliveHosts.map((host) => {
                const openPorts = host.ports?.filter(p => p.open) ?? [];
                const isOpen = openIps.has(host.ip);
                const hasPorts = openPorts.length > 0;
                return (
                  <div key={host.ip} className="langhost__host-wrap">
                    <div
                      className={`langhost__host-row${hasPorts ? ' langhost__host-row--expandable' : ''}`}
                      onClick={() => hasPorts && toggleOpen(host.ip)}
                    >
                      <span className="langhost__host-ip">
                        <span className="langhost__host-dot" />
                        {host.ip}
                      </span>
                      <span className="langhost__host-services">
                        {host.ports == null
                          ? <span className="langhost__host-probing">probing…</span>
                          : hasPorts
                            ? <>{openPorts.map(p => p.label).join(', ')}<span className="langhost__host-toggle">{isOpen ? ' ▲' : ' ▼'}</span></>
                            : <span className="langhost__host-none">no open ports</span>
                        }
                      </span>
                    </div>
                    {isOpen && hasPorts && (
                      <div className="langhost__port-list">
                        {openPorts.map(p => (
                          <div key={p.port} className="langhost__port-row">
                            <span className="langhost__port-num">{p.port}</span>
                            <span className="langhost__port-label">{p.label}</span>
                            <a
                              className="langhost__port-link"
                              href={`http://${host.ip}:${p.port}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              open →
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
