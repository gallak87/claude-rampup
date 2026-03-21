# NakedBrowser

what does your browser expose to every site you visit? turns out, a lot.

passive recon tool that runs entirely client-side. no server, no tracking, no install. just open it and get existentially uncomfortable.

![NakedBrowser in action](./screenshot.png)

## what it does

- **WebRTC IP leak** — bypasses VPN/proxy to grab your real public IP via ICE candidates
- **localhost port scan** — fetch() timing side-channel to find open DBs, dev servers, docker daemons
- **browser fingerprint** — canvas, WebGL renderer, AudioContext, fonts → entropy score
- **navigator leaks** — CPU threads, device memory, timezone, screen, network type, the works

```
npm install && npm run dev
```

that's it. runs on http so the port scanner actually works.

## roadmap (shipping nowhere, vibes only)

- [ ] **tool picker** — modular toolbar, enable/disable individual probes, save presets
- [ ] **live port monitor** — continuous scan mode, alerts when a new service pops up on localhost
- [ ] **LAN ghost** — subnet sweep via timing side-channels, map your entire local network from a tab
- [ ] **VPN lie detector** — cross-ref WebRTC IP vs timezone vs DNS resolver to score how badly your VPN is failing you
- [ ] **satellite mode** — OSINT enrichment on discovered IPs: ASN, geo, abuse reports, reverse DNS. point at yourself, feel watched.

---

built with vite 8 + react 19. no dependencies beyond the browser.
