import { useReducer } from 'react';
import type { ScanState, ScanAction, ProbeId, ProbeResult } from '../types/probe';
import { useScan } from '../hooks/useScan';
import { ProbeCard } from '../components/ProbeCard';
import { ScanButton } from '../components/ScanButton';
import { OverallScore } from '../components/OverallScore';

function makeProbe(id: ProbeId, label: string): ProbeResult {
  return { id, label, description: '', status: 'idle', findings: [] };
}

const initialState: ScanState = {
  scanning: false,
  probes: {
    webrtc:      makeProbe('webrtc',      'WebRTC IP Leak'),
    portScan:    makeProbe('portScan',    'Localhost Port Scan'),
    fingerprint: makeProbe('fingerprint', 'Browser Fingerprint'),
    navigator:   makeProbe('navigator',   'Navigator Leaks'),
  },
};

function allSettled(probes: Record<ProbeId, ProbeResult>): boolean {
  return Object.values(probes).every(p => p.status === 'done' || p.status === 'error');
}

function scanReducer(state: ScanState, action: ScanAction): ScanState {
  switch (action.type) {
    case 'SCAN_START':
      return {
        scanning: true,
        probes: Object.fromEntries(
          Object.entries(state.probes).map(([id, p]) => [
            id,
            { ...p, status: 'running', findings: [], error: undefined, durationMs: undefined },
          ])
        ) as unknown as Record<ProbeId, ProbeResult>,
      };

    case 'PROBE_DONE': {
      const probes = {
        ...state.probes,
        [action.probeId]: {
          ...state.probes[action.probeId],
          status: 'done' as const,
          findings: action.findings,
          durationMs: action.durationMs,
        },
      };
      return { probes, scanning: !allSettled(probes) };
    }

    case 'PROBE_ERROR': {
      const probes = {
        ...state.probes,
        [action.probeId]: {
          ...state.probes[action.probeId],
          status: 'error' as const,
          error: action.error,
        },
      };
      return { probes, scanning: !allSettled(probes) };
    }

    case 'SCAN_RESET':
      return initialState;
  }
}

export function LocalhostScanner() {
  const [state, dispatch] = useReducer(scanReducer, initialState);
  const { startScan } = useScan(dispatch);
  const hasResults = Object.values(state.probes).some(p => p.status !== 'idle');

  return (
    <>
      <OverallScore probes={state.probes} />
      <div className="rendertrap">
        <div className="rendertrap__header">
          <p className="rendertrap__desc">
            probes WebRTC, open ports, and browser fingerprint — all client-side, no requests leave your machine.
          </p>
          <ScanButton
            scanning={state.scanning}
            hasResults={hasResults}
            onScan={startScan}
            onReset={() => dispatch({ type: 'SCAN_RESET' })}
          />
        </div>
        <div className="probe-grid">
          {(Object.values(state.probes) as ProbeResult[]).map(probe => (
            <ProbeCard key={probe.id} probe={probe} />
          ))}
        </div>
      </div>
    </>
  );
}
