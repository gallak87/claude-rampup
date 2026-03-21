import { useCallback } from 'react';
import type { Dispatch } from 'react';
import type { Finding, ProbeId, ScanAction } from '../types/probe';
import { probeWebRTC } from '../probes/webrtc';
import { probePortScan } from '../probes/portScan';
import { probeFingerprint } from '../probes/fingerprint';
import { probeNavigator } from '../probes/navigator';

async function runProbe(
  id: ProbeId,
  fn: () => Promise<Finding[]>,
  dispatch: Dispatch<ScanAction>
) {
  const start = performance.now();
  try {
    const findings = await fn();
    dispatch({ type: 'PROBE_DONE', probeId: id, findings, durationMs: Math.round(performance.now() - start) });
  } catch (e) {
    dispatch({ type: 'PROBE_ERROR', probeId: id, error: String(e) });
  }
}

export function useScan(dispatch: Dispatch<ScanAction>) {
  const startScan = useCallback(async () => {
    dispatch({ type: 'SCAN_START' });
    await Promise.allSettled([
      runProbe('webrtc',      () => probeWebRTC(),                      dispatch),
      runProbe('portScan',    () => probePortScan(),                    dispatch),
      runProbe('fingerprint', () => probeFingerprint(),                 dispatch),
      runProbe('navigator',   () => Promise.resolve(probeNavigator()),  dispatch),
    ]);
  }, [dispatch]);

  return { startScan };
}
