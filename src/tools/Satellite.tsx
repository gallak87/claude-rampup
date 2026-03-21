import { useState } from 'react';
import { ScanButton } from '../components/ScanButton';
import { Card } from '../components/Card';
import { fetchGeo, fetchRdns, getWebRTCIps, geoAvailable } from '../probes/satellite';
import type { GeoResult } from '../probes/satellite';
import type { LanHost } from '../probes/lanSweep';

interface EnrichEntry {
  ip: string;
  isPublic: boolean;
  source: 'webrtc' | 'lan';
  geo?: GeoResult | null;
  rdns?: string | null;
  status: 'pending' | 'done';
}

interface SatelliteProps {
  lanHosts: LanHost[];
}

export function Satellite({ lanHosts }: SatelliteProps) {
  const [opted, setOpted] = useState(false);
  const [entries, setEntries] = useState<EnrichEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(false);

  async function enrich() {
    if (running) return;
    setRunning(true);
    setRan(true);
    setEntries([]);

    const { publicIps, localIps } = await getWebRTCIps();

    const raw: EnrichEntry[] = [
      ...publicIps.map(ip => ({ ip, isPublic: true,  source: 'webrtc' as const, status: 'pending' as const })),
      ...localIps.map(ip => ({ ip, isPublic: false, source: 'webrtc' as const, status: 'pending' as const })),
      ...lanHosts.map(h  => ({ ip: h.ip, isPublic: false, source: 'lan' as const,    status: 'pending' as const })),
    ];

    const seen = new Set<string>();
    const deduped = raw.filter(e => !seen.has(e.ip) && seen.add(e.ip) as unknown as boolean);

    setEntries(deduped);

    await Promise.all(deduped.map(async (entry, idx) => {
      const [geo, rdns] = await Promise.all([
        entry.isPublic ? fetchGeo(entry.ip) : Promise.resolve(null),
        fetchRdns(entry.ip),
      ]);
      setEntries(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], geo, rdns, status: 'done' };
        return next;
      });
    }));

    setRunning(false);
  }

  function reset() {
    setEntries([]);
    setRan(false);
  }

  const publicEntries  = entries.filter(e => e.isPublic);
  const privateEntries = entries.filter(e => !e.isPublic);
  const noGeo = !geoAvailable();

  return (
    <div className="satellite">
      {/* Opt-in */}
      <div
        className={`satellite__optin${opted ? ' satellite__optin--active' : ''}`}
        onClick={() => setOpted(o => !o)}
        role="checkbox"
        aria-checked={opted}
      >
        <span className="satellite__optin-check">{opted ? '▣' : '▢'}</span>
        <div className="satellite__optin-text">
          <span className="satellite__optin-label">allow external requests</span>
          <span className="satellite__optin-detail">ip-api.com (geo · ASN · ISP) · dns.google (reverse DNS)</span>
        </div>
      </div>

      {opted && (
        <>
          {noGeo && (
            <p className="satellite__notice">
              geo unavailable — ip-api.com is HTTP-only on the free tier, blocked by this page's HTTPS context.
              reverse DNS still works.
            </p>
          )}

          <div className="satellite__controls">
            <ScanButton
              scanning={running}
              hasResults={ran}
              onScan={enrich}
              onReset={reset}
              label="ENRICH"
              scanningLabel="enriching…"
            />
            {!ran && lanHosts.length === 0 && (
              <span className="satellite__hint">no LAN hosts yet — run a network sweep to include them</span>
            )}
            {ran && !running && lanHosts.length > 0 && (
              <span className="satellite__hint">{lanHosts.length} LAN host{lanHosts.length !== 1 ? 's' : ''} included</span>
            )}
          </div>

          {entries.length > 0 && (
            <div className="satellite__results">
              {publicEntries.length > 0 && (
                <>
                  <p className="satellite__section-label">public IPs (webrtc)</p>
                  <Card className="satellite__table">
                    {publicEntries.map(e => <EnrichRow key={e.ip} entry={e} />)}
                  </Card>
                </>
              )}

              {privateEntries.length > 0 && (
                <>
                  <p className="satellite__section-label">private hosts</p>
                  <Card className="satellite__table">
                    {privateEntries.map(e => <EnrichRow key={e.ip} entry={e} />)}
                  </Card>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function EnrichRow({ entry }: { entry: EnrichEntry }) {
  const pending = entry.status === 'pending';
  return (
    <div className="satellite__row">
      <div className="satellite__row-ip">
        <span className={`satellite__badge satellite__badge--${entry.source}`}>{entry.source}</span>
        <span className="satellite__addr">{entry.ip}</span>
      </div>
      <div className="satellite__row-detail">
        {pending ? (
          <span className="satellite__loading">enriching…</span>
        ) : (
          <>
            {entry.geo ? (
              <span className="satellite__geo">
                {entry.geo.country}
                {entry.geo.city ? ` · ${entry.geo.city}` : ''}
                {' · '}{entry.geo.isp}
                {entry.geo.as ? <span className="satellite__asn"> {entry.geo.as}</span> : null}
              </span>
            ) : (
              entry.isPublic && <span className="satellite__no-geo">geo unavailable</span>
            )}
            {!entry.isPublic && !entry.geo && (
              <span className="satellite__private">private range</span>
            )}
            {entry.rdns ? (
              <span className="satellite__rdns">↩ {entry.rdns}</span>
            ) : (
              entry.status === 'done' && <span className="satellite__no-rdns">no rDNS</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}
