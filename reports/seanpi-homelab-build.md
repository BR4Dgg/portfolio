# Homelab Build Log
## SeanPi — Building a Security Stack on a Raspberry Pi 5

**Date:** March 12, 2026  
**Author:** Sean Magee, Cybersecurity Engineering Student  
**Status:** Active / Ongoing

---

## Overview

I'm working through my ISC2 CC and Security+ certifications and got tired of just reading about tools. So I built a real security monitoring stack on a Raspberry Pi 5 sitting on my desk. This is a full log of everything I set up in one session — what it does, why I set it up, and what I actually learned from it.

**Hardware:** Raspberry Pi 5 4GB  
**OS:** Raspberry Pi OS Lite 64-bit (headless)  
**Static IP:** 192.168.0.2  
**Total domains blocked:** 1,000,000+  
**Bad IPs blocked by CrowdSec:** 15,000+

---

## 1. Static IP

First thing was locking the Pi to a fixed IP address so nothing moves around on me. By default routers hand out random IPs to devices. I set the Pi to `192.168.0.2` through NetworkManager so it never changes — everything else in the stack needs to know exactly where to find it.

---

## 2. Pi-hole + Unbound

**Pi-hole** acts as a DNS server for the entire network. Every device at home now sends DNS requests through the Pi first. Pi-hole checks each request against blocklists and drops anything that matches — ads, trackers, malware domains. Currently blocking over 1 million domains across three lists:

- Hagezi Pro
- OISD Big
- Hagezi TIF

**Unbound** sits behind Pi-hole and resolves DNS directly with the authoritative root servers instead of sending queries upstream to Google or Cloudflare. No third party sees what I'm looking up.

> Pi-hole is the bouncer. Unbound means you don't have to whisper your guest list to Google first.

I also handed DHCP over to Pi-hole so every device on the network automatically uses it for DNS without any manual configuration.

---

## 3. Tailscale VPN

Tailscale creates an encrypted mesh network between all my devices using WireGuard. My Pi, Windows desktop, and iPhone are all connected with fixed Tailscale IPs regardless of where I am.

| Device | Tailscale IP |
|--------|-------------|
| SeanPi | 100.119.161.123 |
| Windows Desktop | 100.107.12.52 |
| iPhone | 100.103.102.63 |

Also configured the Pi as an exit node so I can route all traffic through home when on public WiFi. Key expiry disabled.

---

## 4. Security Hardening

Standard lockdown applied before exposing any services:

- **Fail2ban** — bans IPs that fail SSH login attempts too many times
- **UFW** — firewall, only ports I actually use are open
- **SSH hardening** — disabled root login, limited auth attempts, idle timeout
- **Unattended upgrades** — security patches apply automatically overnight

---

## 5. CrowdSec

CrowdSec is an intrusion detection system with community threat intelligence layered on top. It watches logs in real time for attack patterns and bans offending IPs directly at the firewall level via an nftables bouncer.

What makes it different: millions of CrowdSec users share attack data anonymously. The moment an IP attacks someone else in the community, it gets blocked everywhere — including me.

**Blocked within the first few hours of going live:**

| Threat Type | Count |
|------------|-------|
| HTTP crawlers | 6,579 |
| HTTP scanners | 5,362 |
| SSH brute force | 2,425 |
| HTTP brute force | 496 |
| HTTP exploits | 126 |
| HTTP DoS | 12 |
| **Total** | **15,000+** |

These aren't hypothetical. The moment something is exposed to the internet, scanners find it within minutes. Watching this in real time made the threat model content from my coursework actually click.

---

## 6. Docker + Service Stack

Everything beyond the base OS runs in Docker containers — isolated, independently managed, automatically updated. Portainer provides a web UI so I'm not SSHing in every time. Watchtower runs as a cron job at 3am and pulls updated images automatically. Nginx Proxy Manager routes traffic using friendly local domain names.

**Running containers:**

| Container | Purpose | Access |
|-----------|---------|--------|
| Pi-hole | DNS + DHCP | pihole.lan |
| Portainer | Docker management | 192.168.0.2:9443 |
| Nginx Proxy Manager | Reverse proxy | 192.168.0.2:81 |
| Netdata | Real-time monitoring | netdata.lan |
| Prometheus | Metrics storage | 192.168.0.2:9090 |
| Grafana | Dashboards | grafana.lan |
| Uptime Kuma | Service health alerts | uptime.lan |

---

## 7. Monitoring Stack

**Netdata** — collects 266 real-time metrics every second. CPU, RAM, disk, network, temperature, Docker stats, running processes. Updates every second.

**Prometheus** — scrapes Netdata every 15 seconds and stores it in a time-series database. This means I have historical data, not just live snapshots.

**Grafana** — connects to Prometheus and visualizes everything. Built a custom dashboard with four panels:
- CPU usage %
- RAM usage over time
- CPU temperature (running ~58-62°C)
- Network traffic in/out

**Uptime Kuma** — pings all services every 60 seconds and fires a push notification to my iPhone via Pushover if anything goes down.

---

## 8. Custom Interfaces

**Desktop HUD** — Built a Windows desktop widget using Electron. Sits on my third monitor as a 185px wide vertical sidebar themed like a rally car dashboard. Pulls live data from the Pi every 5 seconds over Tailscale. Shows CPU, RAM, temp, network, uptime, and Pi-hole stats. Launches silently on startup.

**iPhone Widget** — Scriptable app widget showing the same stats in a compact gauge layout. Authenticates with Pi-hole's API automatically and refreshes the session token when it expires.

---

## What I Took Away From This

DNS is way more important than it sounds in textbooks. When you control DNS for your whole network you can actually see everything happening on it — malware, ad trackers, sketchy domains — all of it announces itself through DNS before it can do anything.

The CrowdSec numbers above are what stuck with me most. I didn't do anything to accumulate 15,000 blocked IPs. They were already in the community database from attacks on other people. Defense in depth isn't just a framework concept — I can see each layer doing something different in the logs right now.

The Pi cost under $100. The stack it runs is the same category of tooling security teams use to protect real infrastructure.

---

## What's Next

- Active Directory lab on Proxmox (Windows Server 2022 DC + Windows 10 clients)
- Kali Linux VM for offensive security practice
- Wazuh SIEM for centralized log analysis
- ISC2 CC exam
- CompTIA Security+
