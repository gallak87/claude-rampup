import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import * as THREE from 'three';
import { generateEvent, severityColor, fmtTime, type ThreatEvent } from './threatFeed';

const MAX_FEED = 60;
const ARC_TTL  = 4000;
const INTERVAL = 1200;

const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

type Mode = 'rotate' | 'timelapse';

export function Hawk() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const globeRef      = useRef<ReturnType<typeof Globe> | null>(null);
  const arcsRef       = useRef<ThreatEvent[]>([]);
  const texturesRef   = useRef<THREE.Texture[]>([]);
  const modeRef       = useRef<Mode>('rotate');
  const [feed, setFeed]         = useState<ThreatEvent[]>([]);
  const [mode, setMode]         = useState<Mode>('rotate');
  const [playing, setPlaying]   = useState(true);
  const [fps, setFps]           = useState(4);
  const [monthIdx, setMonthIdx] = useState(0);

  // init globe
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const globe = Globe()(el)
      .width(el.clientWidth)
      .height(el.clientHeight)
      .backgroundColor('#0d0f14')
      .atmosphereColor('#00e87a')
      .atmosphereAltitude(0.15)
      .globeImageUrl('/marble.jpg')
      .arcsData([])
      .arcStartLat((d: object) => (d as ThreatEvent).srcLat)
      .arcStartLng((d: object) => (d as ThreatEvent).srcLng)
      .arcEndLat((d: object)   => (d as ThreatEvent).dstLat)
      .arcEndLng((d: object)   => (d as ThreatEvent).dstLng)
      .arcColor((d: object) => {
        const c = severityColor((d as ThreatEvent).severity);
        return [`${c}22`, c];
      })
      .arcDashLength(0.35)
      .arcDashGap(0.15)
      .arcDashAnimateTime(ARC_TTL * 0.9)
      .arcStroke(0.4)
      .arcAltitudeAutoScale(0.35);

    globe.controls().autoRotate      = true;
    globe.controls().autoRotateSpeed = 0.4;
    globe.controls().enableDamping   = true;

    globeRef.current = globe;

    const observer = new ResizeObserver(() => {
      globe.width(el.clientWidth).height(el.clientHeight);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      globe._destructor?.();
    };
  }, []);

  // preload all 12 month textures into GPU on mount
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    texturesRef.current = MONTHS.map(m =>
      loader.load(`/blue-marble/4k/${m}.jpg`)
    );
    return () => { texturesRef.current.forEach(t => t.dispose()); };
  }, []);

  // swap globe texture directly via material.map — no URL reload
  const swapTexture = (idx: number) => {
    const tex = texturesRef.current[idx];
    if (!tex || !globeRef.current) return;
    globeRef.current.scene().traverse((obj: THREE.Object3D) => {
      if (obj instanceof THREE.Mesh && obj.geometry.type === 'SphereGeometry') {
        const mat = obj.material as THREE.MeshPhongMaterial;
        mat.map = tex;
        mat.needsUpdate = true;
      }
    });
  };

  // threat event loop
  useEffect(() => {
    const timer = setInterval(() => {
      const evt = generateEvent();
      if (modeRef.current === 'rotate') {
        arcsRef.current = [...arcsRef.current, evt];
        globeRef.current?.arcsData(arcsRef.current);
        setTimeout(() => {
          arcsRef.current = arcsRef.current.filter(a => a.id !== evt.id);
          globeRef.current?.arcsData(arcsRef.current);
        }, ARC_TTL);
      }
      setFeed(prev => [evt, ...prev].slice(0, MAX_FEED));
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // keep modeRef in sync
  useEffect(() => { modeRef.current = mode; }, [mode]);

  // rotation pause/play
  useEffect(() => {
    if (!globeRef.current || mode !== 'rotate') return;
    globeRef.current.controls().autoRotate = playing;
  }, [playing, mode]);

  // mode switch
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (mode === 'rotate') {
      g.globeImageUrl('/marble.jpg');
      g.controls().autoRotate = playing;
    } else {
      g.controls().autoRotate = false;
      g.arcsData([]);
      swapTexture(monthIdx);
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // timelapse playback
  useEffect(() => {
    if (mode !== 'timelapse' || !playing) return;
    const timer = setInterval(() => {
      setMonthIdx(i => (i + 1) % 12);
    }, 1000 / fps);
    return () => clearInterval(timer);
  }, [mode, playing, fps]);

  // swap texture on month change
  useEffect(() => {
    if (mode !== 'timelapse') return;
    swapTexture(monthIdx);
  }, [monthIdx, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const monthLabel = MONTHS[monthIdx].slice(0, 3).toUpperCase();

  return (
    <div className="hawk">
      <div ref={containerRef} className="hawk__globe" />

      {/* Controls */}
      <div className="hawk__controls">
        <div className="hawk__controls-row">
          <button
            className={`hawk__ctrl-mode${mode === 'rotate' ? ' hawk__ctrl-mode--active' : ''}`}
            onClick={() => setMode('rotate')}
          >SPOTTER</button>
          <button
            className={`hawk__ctrl-mode${mode === 'timelapse' ? ' hawk__ctrl-mode--active' : ''}`}
            onClick={() => setMode('timelapse')}
          >SEASONS</button>
          <button className="hawk__ctrl-play" onClick={() => setPlaying(p => !p)}>
            {playing ? '⏸' : '▶'}
          </button>
        </div>
        {mode === 'timelapse' && (
          <div className="hawk__controls-row hawk__controls-row--slider">
            <span className="hawk__month">{monthLabel}</span>
            <input
              type="range" min={1} max={12} value={fps}
              onChange={e => setFps(Number(e.target.value))}
              className="hawk__slider"
            />
            <span className="hawk__fps">{fps}fps</span>
          </div>
        )}
      </div>

      {/* Feed — rotate mode only */}
      {mode === 'rotate' && <aside className="hawk__feed">
        <div className="hawk__feed-header">
          <span className="hawk__feed-title">THREAT FEED</span>
          <span className="hawk__feed-live">● LIVE</span>
        </div>
        <div className="hawk__feed-list">
          {feed.map(evt => (
            <div key={evt.id} className={`hawk__event hawk__event--${evt.severity.toLowerCase()}`}>
              <div className="hawk__event-top">
                <span className="hawk__event-badge">{evt.severity}</span>
                <span className="hawk__event-type">{evt.type}</span>
                <span className="hawk__event-time">{fmtTime(evt.ts)}</span>
              </div>
              <div className="hawk__event-ips">
                {evt.srcIp} <span className="hawk__arrow">→</span> {evt.dstIp}
              </div>
            </div>
          ))}
        </div>
      </aside>}
    </div>
  );
}
