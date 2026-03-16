# SeanPi Homelab — Service Dashboard & Security Cleanup
## Docker Socket Hardening, Homepage Dashboard, Custom Dashboard, Email Configuration

**Date:** March 15, 2026
**Author:** Sean Magee, Cybersecurity Engineering Student
**Status:** Completed

---

## Overview

This session completed Docker socket hardening, deployed and configured the Homepage dashboard with live service widgets, built a fully custom PS3 themed real-time dashboard, configured email for the magee.pro domain, and performed a full security audit and cleanup of exposed credentials and unnecessary network connections.

**Hardware:** Raspberry Pi 5 4GB
**OS:** Raspberry Pi OS Lite 64-bit (headless)
**Stack additions this session:** docker-socket-proxy, Homepage, custom Nginx dashboard container

---

## 1. Docker Socket Hardening

### Problem

Portainer had the Docker socket mounted directly at `/var/run/docker.sock` with no restrictions. A compromised Portainer instance or any container with socket access could escape to full host control — creating privileged containers, mounting the host filesystem, or running arbitrary commands as root.

### Solution

Deployed `tecnativa/docker-socket-proxy` as a filtering layer between Portainer and the actual socket. The proxy exposes only the API endpoints Portainer needs for management and blocks all destructive operations.

```bash
docker network create portainer_network
docker run -d --name docker-socket-proxy --network portainer_network \
  -v /var/run/docker.sock:/var/run/docker.sock:ro \
  -e CONTAINERS=1 -e IMAGES=1 -e VOLUMES=1 -e NETWORKS=1 \
  -e SERVICES=1 -e TASKS=1 -e INFO=1 -e VERSION=1 \
  -e PING=1 -e POST=1 \
  tecnativa/docker-socket-proxy
```

Portainer was then recreated pointing to the proxy instead of the raw socket:

```bash
docker run -d --name portainer --network portainer_network \
  -p 9443:9443 -v portainer_data:/data \
  -e DOCKER_HOST=tcp://docker-socket-proxy:2375 \
  portainer/portainer-ce:latest
```

| Component | Before | After |
|-----------|--------|-------|
| Socket mount | /var/run/docker.sock direct | Via docker-socket-proxy filter |
| Portainer network | bridge (default) | portainer_network (isolated) |
| Environment ID | 1 (broken local) | 5 (local-proxy) |

---

## 2. Email Configuration

### Problem

No MX records were configured for magee.pro. All email sent to sean@magee.pro was bouncing silently.

### DNS Records Added

| Type | Name | Value | Purpose |
|------|------|-------|---------|
| MX | @ | mx.zoho.com (10), mx2.zoho.com (20), mx3.zoho.com (50) | Mail routing to Zoho |
| TXT | @ | v=spf1 include:zoho.com ~all | Authorizes Zoho to send mail |
| TXT | _dmarc | v=DMARC1; p=none; rua=mailto:sean@magee.pro | DMARC monitoring |
| TXT | zmail._domainkey | [auto-configured by Zoho] | Cryptographic mail signing |

DKIM was already verified by Zoho from initial domain setup. All four layers of email authentication are now active. DMARC is currently at `p=none` for monitoring — tighten to `p=quarantine` or `p=reject` once mail stability is confirmed over several weeks.

---

## 3. Homepage Dashboard

### Deployment

Homepage (`ghcr.io/gethomepage/homepage`) deployed as a Docker container on port 3002. No Docker socket mount — all data is fetched via service APIs server-side. Credentials never reach the browser.

### Live Widgets Configured

| Service | Widget | Data |
|---------|--------|------|
| Grafana | grafana | Dashboard count, alert count |
| Pi-hole | pihole v6 | Queries, blocked %, gravity count |
| Portainer | portainer | Running and stopped container counts |
| Uptime Kuma | uptimekuma | Sites up, sites down, incidents |

### Theme

PS3 XMB inspired theme applied via SVG gradient background image served from `/app/public/images/bg.svg`. Deep navy to purple gradient with elliptical wave ribbons matching the PlayStation 3 ambient background aesthetic. Custom CSS applies Noto Sans font and alternating blue/purple frosted glass card borders.

The key insight for theming Homepage: Tailwind CSS utility classes cannot be overridden with `body` or `html` selectors in custom CSS. The correct approach is to serve a gradient as a background image via the `background:` setting in `settings.yaml` — this bypasses Tailwind entirely.

### Public Access

`dashboard.magee.pro` routes through Cloudflare tunnel to Nginx Proxy Manager to Homepage, protected by Authelia requiring username, password, and TOTP second factor. Unauthenticated requests redirect to `auth.magee.pro`.

---

## 4. Custom Real-Time Dashboard

### Architecture

A fully custom HTML/CSS/JS dashboard served by a dedicated Nginx Docker container on port 3003. Pulls live data from multiple APIs every 5 seconds via Nginx reverse proxy.

| Data Source | Endpoint | Data |
|-------------|----------|------|
| Homepage API | /hp-api/widgets/resources | CPU, RAM, disk, uptime |
| Netdata API | Port 19999 /api/v1/data | CPU temperature |
| Pi-hole API | Port 8888 /api/ | Queries, blocked %, top domains, clients, DHCP |
| Portainer (proxied) | /pt-api/endpoints/[ENV_ID]/docker/ | Container list and status |
| Netdata system.net | Port 19999 | Network in/out traffic rates |

### Design

PS3 XMB aesthetic — deep navy/purple gradient background with elliptical wave ribbons, frosted glass cards with alternating blue and purple tints, Noto Sans light weight typography. Features include speedometer gauges for CPU and temperature with color-coded threshold zones, doughnut charts for memory and disk utilization, live dual-line network traffic chart, Pi-hole top blocked domains, query type breakdown with bar charts, DNS client rankings, DHCP lease table, and per-container Docker status grid with live health indicators.

### Security Model

The Portainer API key is stored in `nginx.conf` on the Pi and injected as a request header at the Nginx proxy level. The browser never receives or transmits the key directly. Pi-hole authentication uses session tokens that auto-renew every 4.5 minutes. The dashboard is accessible only via Tailscale on port 3003, and via `dashboard.magee.pro` behind Authelia.

### CORS Resolution

The browser security model blocks cross-origin requests between ports. All API calls are routed through the same Nginx container so all requests share a single origin, eliminating CORS issues. Nginx handles OPTIONS preflight requests with a 204 response before forwarding actual requests to upstream services.

### iPhone 13 Pro Kiosk

The iPhone 13 Pro (iOS 17.5.1) was enrolled in Tailscale and configured as an always-on kiosk display mounted on the homelab via Velcro. Adding the dashboard to Safari home screen creates a standalone web app with no browser chrome. Guided Access locks the device into the dashboard. Auto-Lock set to Never with permanent charging.

---

## 5. Security Cleanup

### Credentials Regenerated

During the session, API keys were inadvertently exposed. The following were regenerated:

- Portainer API key — old key deleted, new key generated and configured
- Uptime Kuma API key — old key deleted, new key generated and configured

### Network Connections Cleaned

Homepage had been connected to unnecessary Docker networks during debugging:

| Network | Action | Reason |
|---------|--------|--------|
| authelia_default | Disconnected | Not required for any Homepage function |
| nginx-proxy_default | Disconnected | Not required for any Homepage function |
| portainer_network | Disconnected | Homepage uses bridge for 172.17.0.1 host access |

### UFW Updates

Port 3003 added for the custom dashboard:

```bash
sudo ufw allow in on tailscale0 to any port 3003 proto tcp
sudo ufw allow in on docker0 from 172.17.0.0/16 to any port 3003 proto tcp
```

---

## 6. What I Learned

**Docker socket proxy** is the correct pattern for any container management tool. Never mount the raw socket directly — always use a filtering proxy that exposes only the minimum required API surface.

**Tailwind CSS specificity** cannot be beaten with custom CSS selectors applied to `body` or `html`. When theming a Tailwind-based application, work with the framework's own configuration mechanisms rather than fighting it from the outside.

**CORS** is a same-origin policy enforcement by the browser. The fix is always to make all requests appear to come from the same origin via a reverse proxy — not to add headers to individual responses. Handle OPTIONS preflight requests explicitly or complex cross-origin calls will silently fail.

**Email** is always DNS. Check MX records first.

**Credential hygiene** — never paste commands containing real credentials into a chat interface. Always use placeholder values and substitute in the terminal directly.

---

## What Is Next

- Network segmentation — highest remaining security priority, flat network allows lateral movement
- Individual subdomains behind Authelia
- CrowdSec Pushover alerts
- Home Assistant on Pi as Docker container
- Tighten DMARC to p=quarantine once email stability confirmed

---

## Report Metadata

**Author:** Sean Magee
**Contact:** sean@magee.pro
**Date:** March 15, 2026
**Version:** 1.0
**Classification:** Public / Educational

**Disclosure:** This report was prepared for educational purposes as part of ongoing cybersecurity study and homelab development. Specific port numbers, internal addresses, and credentials have been omitted or replaced with placeholders.

**License:** This report may be shared for educational and defensive security purposes with proper attribution.

---

## References

1. tecnativa/docker-socket-proxy — https://github.com/Tecnativa/docker-socket-proxy
2. Homepage Dashboard — https://gethomepage.dev
3. Zoho Mail DNS Configuration — https://www.zoho.com/mail/help/adminconsole/configure-email-delivery.html
4. DMARC — https://dmarc.org
5. CORS — https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
