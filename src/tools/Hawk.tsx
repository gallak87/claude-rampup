import { useEffect, useRef, useState } from 'react';
import Globe from 'globe.gl';
import { generateEvent, severityColor, fmtTime, type ThreatEvent } from './threatFeed';

const MAX_FEED = 60;
const ARC_TTL  = 4000;
const INTERVAL = 1200;

export function Hawk() {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef     = useRef<ReturnType<typeof Globe> | null>(null);
  const arcsRef      = useRef<ThreatEvent[]>([]);
  const [feed, setFeed] = useState<ThreatEvent[]>([]);

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
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg')
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

  // event loop
  useEffect(() => {
    const timer = setInterval(() => {
      const evt = generateEvent();

      arcsRef.current = [...arcsRef.current, evt];
      globeRef.current?.arcsData(arcsRef.current);

      setTimeout(() => {
        arcsRef.current = arcsRef.current.filter(a => a.id !== evt.id);
        globeRef.current?.arcsData(arcsRef.current);
      }, ARC_TTL);

      setFeed(prev => [evt, ...prev].slice(0, MAX_FEED));
    }, INTERVAL);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="hawk">
      <div ref={containerRef} className="hawk__globe" />

      <aside className="hawk__feed">
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
      </aside>
    </div>
  );
}
