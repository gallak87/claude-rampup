import { useEffect, useRef } from 'react';
import Globe from 'globe.gl';

export function Hawk() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const globe = Globe()(el);

    globe
      .width(el.clientWidth)
      .height(el.clientHeight)
      .backgroundColor('#0d0f14')
      .atmosphereColor('#00e87a')
      .atmosphereAltitude(0.15)
      .globeImageUrl('//unpkg.com/three-globe/example/img/earth-night.jpg');

    // auto-rotate
    globe.controls().autoRotate = true;
    globe.controls().autoRotateSpeed = 0.4;
    globe.controls().enableDamping = true;

    const observer = new ResizeObserver(() => {
      globe.width(el.clientWidth).height(el.clientHeight);
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
      globe._destructor?.();
    };
  }, []);

  return <div ref={containerRef} className="hawk" />;
}
