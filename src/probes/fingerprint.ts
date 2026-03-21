import type { Finding } from '../types/probe';

function djb2(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unavailable';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Canary 🐦', 2, 15);
    ctx.fillStyle = 'rgba(102,204,0,0.7)';
    ctx.fillText('Canary 🐦', 4, 17);
    // Bezier curve — GPU rasterization differences show up here
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.bezierCurveTo(60, 0, 120, 60, 200, 30);
    ctx.strokeStyle = '#c0392b';
    ctx.stroke();

    return djb2(canvas.toDataURL());
  } catch {
    return 'blocked';
  }
}

function webglInfo(): { vendor: string; renderer: string } {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') ?? canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return { vendor: 'unavailable', renderer: 'unavailable' };

    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    if (ext) {
      return {
        vendor: gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string,
        renderer: gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string,
      };
    }
    // Firefox resistFingerprinting — fall back to masked values
    return {
      vendor: (gl.getParameter(gl.VENDOR) as string) + ' (masked)',
      renderer: (gl.getParameter(gl.RENDERER) as string) + ' (masked)',
    };
  } catch {
    return { vendor: 'blocked', renderer: 'blocked' };
  }
}

async function audioFingerprint(): Promise<number> {
  try {
    const ctx = new OfflineAudioContext(1, 44100, 44100);
    const osc = ctx.createOscillator();
    const comp = ctx.createDynamicsCompressor();

    comp.threshold.setValueAtTime(-50, ctx.currentTime);
    comp.knee.setValueAtTime(40, ctx.currentTime);
    comp.ratio.setValueAtTime(12, ctx.currentTime);
    comp.attack.setValueAtTime(0, ctx.currentTime);
    comp.release.setValueAtTime(0.25, ctx.currentTime);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(10000, ctx.currentTime);
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);

    const buffer = await ctx.startRendering();
    const data = buffer.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) sum += Math.abs(data[i]);
    return Math.round(sum * 1e8) / 1e8;
  } catch {
    return 0;
  }
}

function detectFonts(): string[] {
  const testFonts = [
    'Arial', 'Arial Black', 'Helvetica Neue', 'Times New Roman', 'Courier New',
    'Georgia', 'Verdana', 'Comic Sans MS', 'Impact', 'Trebuchet MS',
    'Palatino', 'Tahoma', 'Calibri', 'Futura', 'Ubuntu',
    'Roboto', 'Menlo', 'Monaco', 'Consolas', 'Fira Code',
  ];

  try {
    const baseFonts = ['monospace', 'sans-serif', 'serif'];
    const testStr = 'mmmmmmmmmmlli';

    const span = document.createElement('span');
    span.style.cssText = 'position:absolute;left:-9999px;font-size:72px;visibility:hidden';
    span.textContent = testStr;
    document.body.appendChild(span);

    const baseWidths: Record<string, number> = {};
    for (const base of baseFonts) {
      span.style.fontFamily = base;
      baseWidths[base] = span.offsetWidth;
    }

    const detected: string[] = [];
    for (const font of testFonts) {
      for (const base of baseFonts) {
        span.style.fontFamily = `'${font}',${base}`;
        if (span.offsetWidth !== baseWidths[base]) {
          detected.push(font);
          break;
        }
      }
    }

    document.body.removeChild(span);
    return detected;
  } catch {
    return [];
  }
}

function estimateEntropy(canvas: string, webgl: { vendor: string; renderer: string }, audio: number, fonts: string[]): number {
  let bits = 0;
  if (canvas !== 'unavailable' && canvas !== 'blocked') bits += 5.7;
  if (!webgl.renderer.includes('unavailable') && !webgl.renderer.includes('masked')) bits += 7.2;
  else if (!webgl.renderer.includes('unavailable')) bits += 3.1;
  if (!webgl.vendor.includes('unavailable') && !webgl.vendor.includes('masked')) bits += 3.1;
  if (audio !== 0) bits += 3.4;
  bits += Math.min(fonts.length * 0.3, 6.5);
  return Math.round(bits * 10) / 10;
}

export async function probeFingerprint(): Promise<Finding[]> {
  const [canvas, audio] = await Promise.all([
    Promise.resolve(canvasFingerprint()),
    audioFingerprint(),
  ]);
  const webgl = webglInfo();
  const fonts = detectFonts();
  const entropyBits = estimateEntropy(canvas, webgl, audio, fonts);
  const uniqueIn = Math.round(Math.pow(2, entropyBits)).toLocaleString();

  const findings: Finding[] = [
    {
      label: 'Canvas hash',
      value: canvas,
      risk: canvas === 'blocked' ? 'info' : 'medium',
      detail: 'GPU rasterization differences produce unique pixel output',
    },
    {
      label: 'WebGL vendor',
      value: webgl.vendor,
      risk: webgl.vendor.includes('masked') ? 'info' : 'medium',
    },
    {
      label: 'WebGL renderer',
      value: webgl.renderer,
      risk: webgl.renderer.includes('masked') || webgl.renderer.includes('unavailable') ? 'info' : 'high',
      detail: 'GPU model exposed — narrows anonymity set significantly',
    },
    {
      label: 'AudioContext fingerprint',
      value: audio !== 0 ? String(audio) : 'unavailable',
      risk: audio !== 0 ? 'medium' : 'info',
      detail: 'Platform audio stack produces subtly different floating-point output',
    },
    {
      label: `Fonts detected (${fonts.length}/${20})`,
      value: fonts.length > 0 ? fonts.slice(0, 5).join(', ') + (fonts.length > 5 ? '…' : '') : 'none detected',
      risk: fonts.length > 12 ? 'high' : fonts.length > 6 ? 'medium' : 'low',
      detail: `Full list: ${fonts.join(', ') || 'none'}`,
    },
    {
      label: 'Entropy estimate',
      value: `~${entropyBits} bits → 1 in ${uniqueIn} users`,
      risk: entropyBits > 18 ? 'critical' : entropyBits > 12 ? 'high' : entropyBits > 6 ? 'medium' : 'low',
      detail: 'Rough estimate based on published fingerprinting research (Eckersley 2010, AmIUnique)',
    },
  ];

  return findings;
}
