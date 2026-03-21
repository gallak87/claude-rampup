import type { RiskLevel } from '../types/probe';

export type DetectMethod = 'global' | 'dom' | 'war';
export type DetectStatus = 'idle' | 'pending' | 'detected' | 'clear' | 'skipped';

export interface ExtensionDef {
  name: string;
  category: string;
  reveals: string;
  risk: RiskLevel;
  method: DetectMethod;
  detect: () => boolean | Promise<boolean>;
}

export interface SnitchResult extends Omit<ExtensionDef, 'detect'> {
  status: DetectStatus;
}

function isChromium(): boolean {
  return !!(window as unknown as { chrome?: { runtime?: unknown } }).chrome?.runtime;
}

async function probeWAR(extensionId: string, resourcePath: string): Promise<boolean> {
  if (!isChromium()) return false;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 1500);
    const res = await fetch(`chrome-extension://${extensionId}/${resourcePath}`, {
      signal: ac.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

const w = window as Record<string, unknown>;

export const EXTENSIONS: ExtensionDef[] = [
  // ── Crypto / Web3 ────────────────────────────────────────────────────────
  {
    name: 'MetaMask',
    category: 'crypto',
    reveals: 'MetaMask extension is installed',
    risk: 'medium',
    method: 'global',
    detect: () => !!(w.ethereum as Record<string, unknown>)?.isMetaMask,
  },
  {
    name: 'Coinbase Wallet',
    category: 'crypto',
    reveals: 'uses Coinbase crypto wallet',
    risk: 'medium',
    method: 'global',
    detect: () => !!(w.ethereum as Record<string, unknown>)?.isCoinbaseWallet,
  },
  {
    name: 'Phantom',
    category: 'crypto',
    reveals: 'has a Solana wallet',
    risk: 'medium',
    method: 'global',
    detect: () =>
      !!(w.phantom as Record<string, unknown>)?.solana ||
      !!(w.solana as Record<string, unknown>)?.isPhantom,
  },
  {
    name: 'Polkadot.js',
    category: 'crypto',
    reveals: 'Polkadot.js extension is installed',
    risk: 'medium',
    method: 'global',
    detect: () => !!(w.injectedWeb3 as Record<string, unknown>)?.['polkadot-js'],
  },
  {
    name: 'Any Web3 wallet',
    category: 'crypto',
    reveals: 'has a browser crypto wallet',
    risk: 'medium',
    method: 'global',
    detect: () => !!w.ethereum && !(w.ethereum as Record<string, unknown>)?.isMetaMask && !(w.ethereum as Record<string, unknown>)?.isCoinbaseWallet,
  },

  // ── Dev Tools ─────────────────────────────────────────────────────────────
  {
    name: 'React DevTools',
    category: 'devtools',
    reveals: 'is a React developer',
    risk: 'low',
    method: 'global',
    detect: () => !!(w.__REACT_DEVTOOLS_GLOBAL_HOOK__),
  },
  {
    name: 'Redux DevTools',
    category: 'devtools',
    reveals: 'is a developer using Redux',
    risk: 'low',
    method: 'global',
    detect: () => !!(w.__REDUX_DEVTOOLS_EXTENSION__),
  },
  {
    name: 'Vue DevTools',
    category: 'devtools',
    reveals: 'is a Vue.js developer',
    risk: 'low',
    method: 'global',
    detect: () => !!(w.__VUE_DEVTOOLS_GLOBAL_HOOK__),
  },

  // ── Writing ───────────────────────────────────────────────────────────────
  {
    name: 'Grammarly',
    category: 'writing',
    reveals: 'uses AI writing assistance',
    risk: 'low',
    method: 'dom',
    detect: () =>
      document.documentElement.hasAttribute('data-gr-ext-installed') ||
      document.documentElement.hasAttribute('data-new-gr-c-s-check-loaded'),
  },

  // ── Privacy (WAR — Chromium only) ─────────────────────────────────────────
  {
    name: 'uBlock Origin',
    category: 'privacy',
    reveals: 'blocks ads and trackers',
    risk: 'info',
    method: 'war',
    detect: () => probeWAR('cjpalhdlnbpafiamejdnhcphjbkeiagm', 'img/browsericons/icon19.svg'),
  },
  {
    name: 'AdBlock Plus',
    category: 'privacy',
    reveals: 'blocks ads',
    risk: 'info',
    method: 'war',
    detect: () => probeWAR('cfhdojbkjhnklbpkdaibdccddilifddb', 'icons/abp-32.png'),
  },
  {
    name: 'Privacy Badger',
    category: 'privacy',
    reveals: 'blocks trackers (EFF)',
    risk: 'info',
    method: 'war',
    detect: () => probeWAR('pkehgijcmpdhfbdbbnkijodmdjhbjlgp', 'skin/images/icon32.png'),
  },
  {
    name: 'DuckDuckGo Privacy',
    category: 'privacy',
    reveals: 'uses DuckDuckGo tracker protection',
    risk: 'info',
    method: 'war',
    detect: () => probeWAR('bkbkknnolddbkkhkfdkcdfjamibcmcpg', 'img/logo_reversed_128.png'),
  },

  // ── Password Managers (WAR — Chromium only) ───────────────────────────────
  {
    name: 'LastPass',
    category: 'password',
    reveals: 'uses a password manager',
    risk: 'medium',
    method: 'war',
    detect: () => probeWAR('hdokiejnpimakedhajhdlcegeplioahd', 'images/icon32.png'),
  },
  {
    name: 'Bitwarden',
    category: 'password',
    reveals: 'uses an open-source password manager',
    risk: 'medium',
    method: 'war',
    detect: () => probeWAR('nngceckbapebfimnlniiiahkandclblb', 'icons/icon32.png'),
  },
  {
    name: '1Password',
    category: 'password',
    reveals: 'uses 1Password',
    risk: 'medium',
    method: 'war',
    detect: () => probeWAR('aeblfdkhhhdcdjpifhhbdiojplfjncoa', 'images/icon-32.png'),
  },
  {
    name: 'Dashlane',
    category: 'password',
    reveals: 'uses Dashlane password manager',
    risk: 'medium',
    method: 'war',
    detect: () => probeWAR('fdjamakpfbbddfjaooikfcpapjohcfmg', 'src/images/icon16.png'),
  },

  // ── Utility ──────────────────────────────────────────────────────────────
  {
    name: 'Dark Reader',
    category: 'utility',
    reveals: 'uses dark mode extension',
    risk: 'info',
    method: 'dom',
    detect: () => !!document.querySelector('[data-darkreader-mode]'),
  },

  // ── Shopping ─────────────────────────────────────────────────────────────
  {
    name: 'Honey',
    category: 'shopping',
    reveals: 'tracks shopping activity for coupons',
    risk: 'medium',
    method: 'war',
    detect: () => probeWAR('bmnlcjabgnpnenekpadlanbbkooimhnj', 'images/logosAndIcons/toolbar/honey-icon-18.png'),
  },
  {
    name: 'Capital One Shopping',
    category: 'shopping',
    reveals: 'uses Capital One shopping tracker',
    risk: 'medium',
    method: 'war',
    detect: () => probeWAR('nenlahapcbofgnanklpelkaejcehkigg', 'images/icon_32.png'),
  },
];

export async function runSnitch(
  onResult: (name: string, status: DetectStatus) => void,
): Promise<void> {
  const chromium = isChromium();

  await Promise.all(EXTENSIONS.map(async (ext) => {
    if (ext.method === 'war' && !chromium) {
      onResult(ext.name, 'skipped');
      return;
    }
    try {
      const detected = await ext.detect();
      onResult(ext.name, detected ? 'detected' : 'clear');
    } catch {
      onResult(ext.name, 'clear');
    }
  }));
}
