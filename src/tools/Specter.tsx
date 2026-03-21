import { useState } from 'react';
import { NavBar } from '../components/NavBar';
import { LocalhostScanner } from './LocalhostScanner';
import { LanGhost } from './LanGhost';
import { Satellite } from './Satellite';
import type { LanHost } from '../probes/lanSweep';

type SpTab = 'machine' | 'network' | 'satellite';

const SP_TABS = [
  { id: 'machine',   label: 'machine'   },
  { id: 'network',   label: 'network'   },
  { id: 'satellite', label: 'satellite' },
] as const;

export function Specter() {
  const [subTab, setSubTab] = useState<SpTab>('machine');
  const [lanHosts, setLanHosts] = useState<LanHost[]>([]);

  return (
    <div className="specter">
      <NavBar items={SP_TABS} active={subTab} onChange={setSubTab} variant="sub" />

      {/* All panes stay mounted so scan state survives tab switches */}
      <div className={subTab === 'machine'   ? 'specter__pane' : 'specter__pane specter__pane--hidden'}>
        <LocalhostScanner />
      </div>
      <div className={subTab === 'network'   ? 'specter__pane' : 'specter__pane specter__pane--hidden'}>
        <LanGhost onAliveHostsUpdated={setLanHosts} />
      </div>
      <div className={subTab === 'satellite' ? 'specter__pane' : 'specter__pane specter__pane--hidden'}>
        <Satellite lanHosts={lanHosts} />
      </div>
    </div>
  );
}
