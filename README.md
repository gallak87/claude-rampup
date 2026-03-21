# Canary

what does your browser expose to every site you visit? turns out, a lot.

```
npm i && npm run dev
```

passive recon tool that runs entirely client-side. no server, no tracking, no install. just open it and get existentially uncomfortable.

![Canary in action](./screenshot.png)

## tools

### Specter
three sub-tools, one tab:

**machine** — what your browser leaks about this machine:
- WebRTC IP leak — bypasses VPN/proxy to grab your real public IP via ICE candidates
- localhost port scan — fetch() timing side-channel to find open DBs, dev servers, docker daemons
- browser fingerprint — canvas, WebGL renderer, AudioContext, fonts → entropy score
- navigator leaks — CPU threads, device memory, timezone, screen, network type, the works

**network** — maps your LAN from a browser tab. no extensions, no permissions. fast TCP RST (~5–50ms) means a host is home; 1.5s timeout means nobody answered. finds alive hosts then probes common service ports on each.

**satellite** — OSINT enrichment on discovered IPs, opt-in (big orange checkbox gates all external calls). sources: public IPs leaked by WebRTC + alive hosts from the network sweep, deduplicated.
- **geo / ASN / ISP** — ip-api.com, free tier, no key. HTTP-only — blocked if the page is served over HTTPS, works fine on localhost
- **reverse DNS** — Google DNS-over-HTTPS (dns.google), works everywhere
- **abuse reports** — not yet implemented. planned: AbuseIPDB (requires free API key)
- private LAN IPs get rDNS only — ip-api.com returns nothing useful for 192.168.x.x ranges

### RenderTrap
your GPU, OS, and driver render the same canvas instructions slightly differently. hover to sample pixels live — each RGB value feeds a djb2 hash, building a fingerprint unique to your render environment. same path → same hash on your machine, different hash on everyone else's.

### StorageMap
maps every persistence vector this origin can use: localStorage, sessionStorage, IndexedDB, cookies, Cache API, OPFS, and persistence grant. shows storage quota, what's claimed, and lets you enumerate the contents of each mechanism. content scripts share the origin — extension data shows up here too.



## roadmap (shipping nowhere, vibes only)

- [ ] **live port monitor** — continuous scan mode, alerts when a new service pops up on localhost
- [ ] **VPN lie detector** — cross-ref WebRTC IP vs timezone vs DNS resolver to score how badly your VPN is failing you
- [ ] **satellite: abuse reports** — AbuseIPDB integration (free API key required) for confidence scores on public IPs
