import { useEffect, useRef, useState, useCallback } from 'react';
import { ScanButton } from '../components/ScanButton';

const W = 240;
const H = 60;
const ZOOM = 6;
const VW = 40; // viewport width in source pixels
const VH = 25; // viewport height in source pixels

interface PixelSample {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  contribution: number;
}

function djb2Step(hash: number, char: number): number {
  return (((hash << 5) + hash) + char) | 0;
}

function drawScene(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, W, H);
  ctx.textBaseline = 'top';
  ctx.font = 'bold 44px Arial';
  ctx.fillStyle = '#f60';
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = '#069';
  ctx.fillText('Canary 🐦', 2, 15);
  ctx.fillStyle = 'rgba(102,204,0,0.7)';
  ctx.fillText('Canary 🐦', 4, 17);
  ctx.beginPath();
  ctx.moveTo(0, 30);
  ctx.bezierCurveTo(60, 0, 120, 60, 200, 30);
  ctx.strokeStyle = '#c0392b';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function clampedRegion(cx: number, cy: number) {
  return {
    x: Math.max(0, Math.min(W - VW, cx - VW / 2)),
    y: Math.max(0, Math.min(H - VH, cy - VH / 2)),
  };
}

function drawZoom(
  zctx: CanvasRenderingContext2D,
  source: HTMLCanvasElement,
  cx: number,
  cy: number,
  highlight: boolean
) {
  const { x, y } = clampedRegion(cx, cy);
  zctx.imageSmoothingEnabled = false;
  zctx.clearRect(0, 0, VW * ZOOM, VH * ZOOM);
  zctx.drawImage(source, x, y, VW, VH, 0, 0, VW * ZOOM, VH * ZOOM);

  if (highlight) {
    const zx = (cx - x) * ZOOM;
    const zy = (cy - y) * ZOOM;
    zctx.strokeStyle = '#00e87a';
    zctx.lineWidth = 1.5;
    zctx.strokeRect(zx, zy, ZOOM, ZOOM);
  }
}

function buildSampleCoords(): { x: number; y: number }[] {
  const coords: { x: number; y: number }[] = [];
  for (let t = 0; t <= 1; t += 0.04) {
    const mt = 1 - t;
    const x = Math.round(mt ** 3 * 0 + 3 * mt ** 2 * t * 60 + 3 * mt * t ** 2 * 120 + t ** 3 * 200);
    const y = Math.round(mt ** 3 * 30 + 3 * mt ** 2 * t * 0 + 3 * mt * t ** 2 * 60 + t ** 3 * 30);
    for (let dy = -2; dy <= 2; dy++) {
      const py = Math.max(0, Math.min(H - 1, y + dy));
      if (!coords.find(c => c.x === x && c.y === py)) coords.push({ x, y: py });
    }
  }
  return coords.slice(0, 32);
}

export function RenderTrap() {
  const sourceRef    = useRef<HTMLCanvasElement>(null);
  const zoomRef      = useRef<HTMLCanvasElement>(null);
  const imageDataRef = useRef<ImageData | null>(null);
  const hashRef      = useRef(5381);
  const [samples, setSamples]   = useState<PixelSample[]>([]);
  const [hash, setHash]         = useState('');
  const [scanning, setScanning] = useState(false);
  const [done, setDone]         = useState(false);
  const [hovering, setHovering] = useState(false);
  const [howOpen, setHowOpen]   = useState(false);

  // initial draw
  useEffect(() => {
    const canvas = sourceRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    drawScene(ctx);
    imageDataRef.current = ctx.getImageData(0, 0, W, H);
    const zctx = zoomRef.current?.getContext('2d');
    if (zctx) drawZoom(zctx, canvas, W / 2, H / 2, false);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (scanning) return;
    const canvas = sourceRef.current;
    const zcanvas = zoomRef.current;
    if (!canvas || !zcanvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = Math.round((e.clientX - rect.left) * (W / rect.width));
    const cy = Math.round((e.clientY - rect.top)  * (H / rect.height));
    const zctx = zcanvas.getContext('2d')!;
    drawZoom(zctx, canvas, cx, cy, true);

    const imgData = imageDataRef.current;
    if (!imgData) return;
    const idx = (cy * W + cx) * 4;
    const r = imgData.data[idx];
    const g = imgData.data[idx + 1];
    const b = imgData.data[idx + 2];
    const prev = hashRef.current;
    hashRef.current = djb2Step(djb2Step(djb2Step(prev, r), g), b);
    const contribution = Math.abs(hashRef.current - prev) % 256;
    setSamples(s => [...s.slice(-19), { x: cx, y: cy, r, g, b, contribution }]);
    setHash((hashRef.current >>> 0).toString(16).padStart(8, '0'));
  }, [scanning]);

  function runScan() {
    const canvas  = sourceRef.current;
    const zcanvas = zoomRef.current;
    if (!canvas || !zcanvas) return;
    const ctx  = canvas.getContext('2d')!;
    const zctx = zcanvas.getContext('2d')!;

    drawScene(ctx);
    imageDataRef.current = ctx.getImageData(0, 0, W, H);
    hashRef.current = 5381;
    setSamples([]);
    setHash('');
    setDone(false);
    setScanning(true);

    const coords    = buildSampleCoords();
    const imageData = ctx.getImageData(0, 0, W, H);
    const collected: PixelSample[] = [];
    let currentHash = 5381;
    let i = 0;

    function step(canvas: HTMLCanvasElement) {
      if (i >= coords.length) {
        setScanning(false);
        setDone(true);
        return;
      }
      const { x, y } = coords[i];
      const idx = (y * W + x) * 4;
      const r = imageData.data[idx];
      const g = imageData.data[idx + 1];
      const b = imageData.data[idx + 2];

      const prev = currentHash;
      currentHash = djb2Step(djb2Step(djb2Step(currentHash, r), g), b);
      const contribution = Math.abs(currentHash - prev) % 256;

      collected.push({ x, y, r, g, b, contribution });
      setSamples([...collected]);
      setHash((currentHash >>> 0).toString(16).padStart(8, '0'));

      // zoom follows the cursor
      drawZoom(zctx, canvas, x, y, true);

      i++;
      setTimeout(() => step(canvas), 60);
    }

    step(canvas);
  }

  return (
    <div className="rendertrap">
      <div className="rendertrap__header">
        <p className="rendertrap__desc">
          same code, different pixels — GPU/OS/driver leave unique traces. we hash them.
        </p>
        <div className="rendertrap__scan-wrap">
          <ScanButton
            scanning={scanning}
            hasResults={done}
            onScan={runScan}
            onReset={() => { hashRef.current = 5381; setSamples([]); setHash(''); setDone(false); }}
            label="TRACE"
            scanningLabel="tracing…"
          />
          <span className="rendertrap__scan-hint">same path → same hash on your machine</span>
        </div>
      </div>

      <div className="rendertrap__panels">
        <div className="rendertrap__canvases">
          <div className="rendertrap__canvas-wrap">
            <span className="rendertrap__canvas-label">rendered canvas — {W}×{H}px</span>
            <canvas
              ref={sourceRef}
              width={W}
              height={H}
              className={`rendertrap__source ${hovering ? 'rendertrap__source--active' : ''}`}
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
            />
          </div>
          <div className="rendertrap__canvas-wrap">
            <button className="rendertrap__how-btn" onClick={() => setHowOpen(o => !o)}>
              {howOpen ? '▲' : '▼'} how it works
            </button>
            {howOpen && (
              <div className="rendertrap__how">
                <p>your GPU, OS, and driver render the same canvas instructions slightly differently — sub-pixel rounding, antialiasing, and blending all vary.</p>
                <p>hover the canvas to sample pixels live. each pixel's RGB feeds a djb2 hash, building a fingerprint unique to your render environment.</p>
              </div>
            )}
          </div>
          <div className="rendertrap__canvas-wrap">
            <span className="rendertrap__canvas-label">
              {scanning ? '6× zoom — following scan cursor' : done ? '6× zoom — hover source to explore' : '6× zoom'}
            </span>
            <canvas
              ref={zoomRef}
              width={VW * ZOOM}
              height={VH * ZOOM}
              className="rendertrap__zoom"
            />
          </div>
        </div>

        <div className="rendertrap__readout">
          <span className="rendertrap__canvas-label">fingerprint output</span>
          <div className="rendertrap__hash-panel">
            <span className="rendertrap__hash-label">djb2 hash</span>
            <span className={`rendertrap__hash-value ${done ? 'rendertrap__hash-value--done' : ''}`}>
              {hash || '--------'}
            </span>
          </div>

          <div className="rendertrap__samples">
            <div className="rendertrap__samples-header">
              <span>pixel</span>
              <span>rgb</span>
              <span>swatch</span>
              <span>hash +/-</span>
            </div>
            <div className="rendertrap__samples-list">
              {samples.slice(-20).map((s, i) => (
                <div key={i} className="rendertrap__sample-row">
                  <span className="rendertrap__sample-coord">{s.x},{s.y}</span>
                  <span className="rendertrap__sample-rgb">{s.r},{s.g},{s.b}</span>
                  <span className="rendertrap__sample-swatch" style={{ background: `rgb(${s.r},${s.g},${s.b})` }} />
                  <span className="rendertrap__sample-delta">+{s.contribution}</span>

                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
