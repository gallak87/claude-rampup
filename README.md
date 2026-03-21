# Canary

what does your browser expose to every site you visit? turns out, a lot.

```
npm i && npm run dev
```

passive recon tool that runs entirely client-side. no server, no tracking, no install. just open it and get existentially uncomfortable.

![Canary in action](./screenshot.png)

## tools

### 127.0.0.1
- **WebRTC IP leak** — bypasses VPN/proxy to grab your real public IP via ICE candidates
- **localhost port scan** — fetch() timing side-channel to find open DBs, dev servers, docker daemons
- **browser fingerprint** — canvas, WebGL renderer, AudioContext, fonts → entropy score
- **navigator leaks** — CPU threads, device memory, timezone, screen, network type, the works

### RenderTrap
your GPU, OS, and driver render the same canvas instructions slightly differently. hover to sample pixels live — each RGB value feeds a djb2 hash, building a fingerprint unique to your render environment. same path → same hash on your machine, different hash on everyone else's.

### StorageMap
maps every persistence vector this origin can use: localStorage, sessionStorage, IndexedDB, cookies, Cache API, OPFS, and persistence grant. shows storage quota, what's claimed, and lets you enumerate the contents of each mechanism. content scripts share the origin — extension data shows up here too.



## roadmap (shipping nowhere, vibes only)

- [ ] **live port monitor** — continuous scan mode, alerts when a new service pops up on localhost
- [ ] **LAN ghost** — subnet sweep via timing side-channels, map your entire local network from a tab
- [ ] **VPN lie detector** — cross-ref WebRTC IP vs timezone vs DNS resolver to score how badly your VPN is failing you
- [ ] **satellite mode** — OSINT enrichment on discovered IPs: ASN, geo, abuse reports, reverse DNS. point at yourself, feel watched.
