import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import * as THREE from 'three';
import { generateEvent, severityColor, fmtTime, type ThreatEvent } from './threatFeed';
import { CAM_FEEDS, type CamFeed } from './camFeeds';

const MAX_FEED = 60;
const ARC_TTL  = 4000;
const INTERVAL = 1200;

const MONTHS = [
  'january','february','march','april','may','june',
  'july','august','september','october','november','december',
];

type Mode = 'rotate' | 'timelapse' | 'cams';

export function Hawk() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const globeRef      = useRef<ReturnType<typeof Globe> | null>(null);
  const arcsRef       = useRef<ThreatEvent[]>([]);
  const texturesRef   = useRef<THREE.Texture[]>([]);
  const modeRef       = useRef<Mode>('rotate');
  const showArcsRef   = useRef(true);
  const [feed, setFeed]         = useState<ThreatEvent[]>([]);
  const [mode, setMode]         = useState<Mode>('rotate');
  const [playing, setPlaying]   = useState(false);
  const [fps, setFps]           = useState(4);
  const [monthIdx, setMonthIdx] = useState(0);
  const [showArcs, setShowArcs] = useState(true);
  const [showFeed, setShowFeed] = useState(true);
  const [showAtmo, setShowAtmo] = useState(true);
  const [activeCam, setActiveCam] = useState<CamFeed | null>(null);

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
      .arcAltitudeAutoScale(0.35)
      .pointsData([])
      .pointLat((d: object) => (d as CamFeed).lat)
      .pointLng((d: object) => (d as CamFeed).lng)
      .pointColor(() => '#00e87a')
      .pointAltitude(0.01)
      .pointRadius(0.6)
      .onPointClick((d: object) => setActiveCam(d as CamFeed));

    globe.controls().autoRotate      = false;
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
      if (modeRef.current === 'rotate' && showArcsRef.current) {
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

  // keep refs in sync
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { showArcsRef.current = showArcs; }, [showArcs]);

  // toggle arcs on/off immediately
  useEffect(() => {
    if (!showArcs) {
      arcsRef.current = [];
      globeRef.current?.arcsData([]);
    }
  }, [showArcs]);

  // toggle atmosphere
  useEffect(() => {
    globeRef.current?.atmosphereAltitude(showAtmo ? 0.15 : 0);
  }, [showAtmo]);

  // rotation pause/play
  useEffect(() => {
    if (!globeRef.current || mode === 'timelapse') return;
    globeRef.current.controls().autoRotate = playing;
  }, [playing, mode]);

  // mode switch
  useEffect(() => {
    const g = globeRef.current;
    if (!g) return;
    if (mode === 'rotate') {
      g.globeImageUrl('/marble.jpg');
      g.controls().autoRotate = playing;
      g.pointsData([]);
      setActiveCam(null);
    } else if (mode === 'timelapse') {
      g.controls().autoRotate = false;
      g.arcsData([]);
      g.pointsData([]);
      setActiveCam(null);
      swapTexture(monthIdx);
    } else {
      g.globeImageUrl('/marble.jpg');
      g.controls().autoRotate = false;
      g.arcsData([]);
      g.pointsData(CAM_FEEDS);
      setPlaying(false);
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
          <button
            className={`hawk__ctrl-mode${mode === 'cams' ? ' hawk__ctrl-mode--active' : ''}`}
            onClick={() => setMode('cams')}
          >CAMS</button>
          <button className="hawk__ctrl-play" onClick={() => setPlaying(p => !p)}>
            {playing ? '⏸' : '▶'}
          </button>
        </div>
        {mode === 'cams' ? null : mode === 'timelapse' ? (
          <div className="hawk__controls-row hawk__controls-row--slider">
            <span className="hawk__month">{monthLabel}</span>
            <input
              type="range" min={1} max={12} value={fps}
              onChange={e => setFps(Number(e.target.value))}
              className="hawk__slider"
            />
            <span className="hawk__fps">{fps}fps</span>
          </div>
        ) : (
          <div className="hawk__controls-row">
            <button className={`hawk__ctrl-mode${showArcs ? ' hawk__ctrl-mode--active' : ''}`} onClick={() => setShowArcs(p => !p)}>ARCS</button>
            <button className={`hawk__ctrl-mode${showFeed ? ' hawk__ctrl-mode--active' : ''}`} onClick={() => setShowFeed(p => !p)}>FEED</button>
            <button className={`hawk__ctrl-mode${showAtmo ? ' hawk__ctrl-mode--active' : ''}`} onClick={() => setShowAtmo(p => !p)}>ATMO</button>
          </div>
        )}
      </div>

      {/* Cam panel */}
      {mode === 'cams' && (
        <aside className="hawk__feed">
          <div className="hawk__feed-header">
            <span className="hawk__feed-title">{activeCam ? activeCam.name.toUpperCase() : 'LIVE CAMS'}</span>
            {activeCam && <button className="hawk__cam-close" onClick={() => setActiveCam(null)}>✕</button>}
          </div>
          {activeCam ? (
            <div className="hawk__cam-player">
              <iframe
                src={`https://www.youtube.com/embed/${activeCam.youtubeId}?autoplay=1&mute=1`}
                allow="autoplay; encrypted-media"
                allowFullScreen
                className="hawk__cam-iframe"
              />
              <p className="hawk__cam-location">{activeCam.location}</p>
            </div>
          ) : (
            <div className="hawk__cam-empty">
              <p>click a pin on the globe</p>
            </div>
          )}
        </aside>
      )}

      {/* Feed — rotate mode + showFeed only */}
      {mode === 'rotate' && showFeed && <aside className="hawk__feed">
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
