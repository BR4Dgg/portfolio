# SeanPi Homelab Security Hardening
## SSH Two Factor Authentication, Portainer Hardening & UFW Lockdown

**Date:** March 14, 2026
**Author:** Sean Magee, Cybersecurity Engineering Student
**Status:** Completed

---

## Overview

This session focused on hardening the three highest priority security gaps identified in a full threat assessment of the SeanPi homelab stack. The work was completed in a single session with two SSH safety sessions maintained throughout to prevent lockout.

**Hardware:** Raspberry Pi 5 4GB
**OS:** Raspberry Pi OS Lite 64-bit (headless)
**Stack:** Pi-hole, Unbound, Tailscale, CrowdSec, Docker, Portainer, Nginx Proxy Manager, Netdata, Prometheus, Grafana, Uptime Kuma, Authelia, Cloudflared

**Tasks completed this session:**

- SSH two factor authentication using Google Authenticator PAM
- Portainer password reset and Tailscale network restriction
- UFW firewall rule overhaul — all sensitive ports locked to Tailscale interface only

---

## 1. Threat Assessment Before the Session

Before touching anything, a full assessment of the environment was conducted. The analogy that framed the work: the gate around the property was already solid — Tailscale controls who can reach the network, Cloudflare tunnels control what is publicly exposed. But once inside, everything was on one floor with no locked doors. These are the risks that were identified and ranked going in.

| Severity | Finding | Addressed This Session |
|----------|---------|----------------------|
| Critical | SSH key alone grants full root with no second factor | Yes |
| Critical | Portainer has no second factor | Partial — Tailscale restriction applied |
| Critical | Docker socket unrestricted — container escape equals full host compromise | Next session |
| High | All sensitive ports open to Anywhere in UFW | Yes |
| High | Services not behind Authelia SSO | Backlog |
| High | No CrowdSec alerting — blind to what is being blocked | Backlog |
| Medium | Authelia storage on SQLite with no access controls | Backlog |
| Medium | Cloudflare tunnel exposes two public hostnames | No action needed |
| Low | TOTP fallback on Authelia is phishable vs WebAuthn only | Backlog |
| Low | 30 day session window on Authelia | Backlog |

---

## 2. SSH Two Factor Authentication

### Objective

Require both an ED25519 private key AND a time based one time password (TOTP) to establish an SSH session. Key alone must be insufficient for access.

### Why This Matters

SSH key authentication with no second factor means anyone who obtains the private key file has complete, unrestricted root access to the system. There is no alerting, no rate limiting on key auth, and no second barrier. The key file sitting on a Windows machine is one laptop theft, one compromised sync service, or one piece of malware away from full system compromise.

### Implementation

Two SSH sessions were opened before any changes were made. This is non-negotiable when modifying SSH configuration — a single misconfigured session with no fallback means permanent lockout.

**Package installation:**

```bash
sudo apt install libpam-google-authenticator -y --ignore-missing
```

Note: The CrowdSec packagecloud repository returned a 404 for Debian trixie during apt update. This is a known upstream issue — CrowdSec was already installed and running so the install completed successfully from the Debian main repository.

**TOTP secret generation:**

```bash
google-authenticator
```

Configuration choices made during interactive setup:

- Time based tokens: yes
- Update the .google_authenticator file: yes
- Disallow token reuse: yes
- 30 second window extension: no
- Rate limiting (3 attempts per 30 seconds): yes

Emergency scratch codes were generated and saved offline. These are single use backup codes and the only recovery path if the authenticator device is lost.

**PAM configuration — /etc/pam.d/sshd:**

Added at the top of the file:

```
auth required pam_google_authenticator.so
```

Commented out to remove password as a fallback auth method:

```
#@include common-auth
```

The password prompt being present creates a false sense of security. Three prompts looks more secure but is actually weaker because a password becomes an alternative path — someone with the key could brute force the password instead of needing the TOTP code. Removing it means key plus TOTP is the only valid combination.

**SSH daemon configuration — /etc/ssh/sshd_config:**

```
KbdInteractiveAuthentication yes
AuthenticationMethods publickey,keyboard-interactive
```

Note: `ChallengeResponseAuthentication` no longer exists in newer versions of OpenSSH on Debian trixie. It has been replaced by `KbdInteractiveAuthentication`. Same function, different directive name.

Config syntax was verified before restarting the daemon:

```bash
sudo sshd -t
```

### Verification

| Test | Expected Result | Outcome |
|------|----------------|---------|
| Key only, no TOTP | Rejected | Pass |
| Key plus wrong TOTP code | Rejected | Pass |
| Key plus correct TOTP code | Shell granted | Pass |
| Password prompt after key | Not prompted | Pass |

### What I Learned

The PAM auth stacking issue was the most interesting part of this. Adding pam_google_authenticator.so at the top of /etc/pam.d/sshd correctly required the TOTP code but leaving @include common-auth in the file caused SSH to also prompt for a password. More prompts does not mean more secure when one of them is a fallback. The fix was commenting out common-auth so key plus TOTP is the only valid path, not key plus (TOTP or password).

---

## 3. Portainer Hardening

### Objective

Secure access to Portainer, the Docker management interface. A compromised Portainer instance gives an attacker full control over every container on the system.

### Built In 2FA

Portainer Community Edition does not include two factor authentication. It is gated behind Portainer Business Edition as a paid feature. The mitigation path chosen was to restrict the Portainer port to the Tailscale interface only, so it is unreachable from the internet or the raw local network without an active Tailscale connection. Portainer will be placed behind Authelia SSO in a future session when all service subdomains are configured.

### Password Reset

The original Portainer password was unknown. Reset was performed using the official Portainer helper image:

```bash
docker stop portainer
docker run --rm -v portainer_data:/data portainer/helper-reset-password
```

The helper image mounts the Portainer data volume directly, resets the admin credential, and exits. Username was confirmed as `sean`. Password was changed to a strong known credential after the reset.

---

## 4. UFW Firewall Overhaul

### State Before Changes

All sensitive ports were open to Anywhere (0.0.0.0/0 and ::/0). This meant any device on the local network or reachable via any interface could attempt connections to SSH, Portainer, Netdata, and the Pi-hole admin panel. The assumption that Tailscale was the access layer was incorrect — UFW does not know about Tailscale. Packets arriving on eth0 from the local network bypass Tailscale entirely.

### The Fix

The correct approach is binding firewall rules to specific network interfaces rather than just ports. `tailscale0` is the dedicated Tailscale interface. Binding a port to `tailscale0` means traffic must physically arrive on that interface — packets from eth0, docker0, or any other interface are denied by default.

| Port | Service | Before | After |
|------|---------|--------|-------|
| [SSH_PORT]/tcp | SSH | Anywhere | tailscale0 only |
| [PORTAINER_PORT]/tcp | Portainer | Anywhere | tailscale0 only |
| [NETDATA_PORT]/tcp | Netdata | Anywhere | tailscale0 only |
| [PIHOLE_PORT]/tcp | Pi-hole admin | Anywhere | tailscale0 only |
| 53/tcp+udp | DNS | Anywhere | eth0, 192.168.x.x/24 only |
| 67/udp | DHCP | Anywhere | eth0, 192.168.x.x/24 only |
| 80/tcp | HTTP (Cloudflare tunnel) | Anywhere | eth0 only |

### Docker Bridge Exception

After applying the Tailscale interface rules, Uptime Kuma began firing down alerts for all monitored services. The cause: Docker containers do not use the tailscale0 interface. They route through docker0 (the Docker bridge interface) with addresses in the 172.17.0.0/16 range. Uptime Kuma was monitoring services from inside Docker and those packets were arriving on docker0, which the new rules did not permit.

Additional rules were added to allow the Docker bridge subnet to reach monitored ports:

```bash
sudo ufw allow in on docker0 from 172.17.0.0/16 to any port [PIHOLE_PORT] proto tcp
sudo ufw allow in on docker0 from 172.17.0.0/16 to any port [NETDATA_PORT] proto tcp
sudo ufw allow in on docker0 from 172.17.0.0/16 to any port [PORTAINER_PORT] proto tcp
sudo ufw allow in on docker0 from 172.17.0.0/16 to any port 53 proto tcp
sudo ufw allow in on docker0 from 172.17.0.0/16 to any port 53 proto udp
```

All monitors returned to green after these rules were applied.

### Final Verified Ruleset

| Rule | Interface | Source | Purpose |
|------|-----------|--------|---------|
| [PORTAINER_PORT]/tcp ALLOW IN | tailscale0 | Tailscale encapsulated | Portainer |
| [NETDATA_PORT]/tcp ALLOW IN | tailscale0 | Tailscale encapsulated | Netdata |
| [PIHOLE_PORT]/tcp ALLOW IN | tailscale0 | Tailscale encapsulated | Pi-hole admin |
| [SSH_PORT]/tcp ALLOW IN | tailscale0 | Tailscale encapsulated | SSH |
| 53/tcp ALLOW IN | eth0 | 192.168.x.x/24 | DNS (LAN only) |
| 53/udp ALLOW IN | eth0 | 192.168.x.x/24 | DNS (LAN only) |
| 67/udp ALLOW IN | eth0 | 192.168.x.x/24 | DHCP (LAN only) |
| 80/tcp ALLOW IN | eth0 | Anywhere | HTTP for Cloudflare tunnel |
| [PIHOLE_PORT]/tcp ALLOW IN | docker0 | 172.17.0.0/16 | Pi-hole monitoring |
| [NETDATA_PORT]/tcp ALLOW IN | docker0 | 172.17.0.0/16 | Netdata monitoring |
| [PORTAINER_PORT]/tcp ALLOW IN | docker0 | 172.17.0.0/16 | Portainer monitoring |
| 53/tcp+udp ALLOW IN | docker0 | 172.17.0.0/16 | DNS from containers |

### What I Learned

Tailscale does not firewall for you. It controls who can route to your IP over the mesh network. UFW controls what happens when packets actually arrive at the interface. These are two separate layers and both need to be configured correctly. A device on the local network never touches Tailscale — it hits eth0 directly and UFW is the only thing standing between it and your services.

The docker0 gotcha is one I will not forget. Any time firewall rules are tightened the question to ask is: what else is hitting these ports that is not me coming in from outside?

---

## 5. Remaining Risk Profile

The perimeter is solid after this session. The remaining risks are almost entirely internal.

| Item | Risk | Next Action |
|------|------|------------|
| Docker socket | Container escape equals full host compromise | Next session |
| Flat network | Lateral movement unrestricted once inside | Network segmentation sprint |
| No Authelia on services | Tailscale compromise exposes all dashboards | Subdomain sprint |
| No CrowdSec alerts | Blind to active threat intelligence blocks | Pushover integration |
| SQLite Authelia storage | File level access if shell is obtained | Low priority |

---

## 6. Security Posture Summary

The gate around the property is now solid. Getting onto the network requires Tailscale and SSH requires both a key and a rotating one time code. However the interior of the network remains flat — once inside, there are no locked doors between rooms. Docker socket hardening and network segmentation are the next structural improvements.

The CrowdSec and Fail2ban data makes this concrete. Within hours of first exposure, thousands of automated scanners found the Pi and attempted connections. Every layer we added today means those attempts get stopped earlier and with less to fall back on if one layer fails.

---

## What Is Next

- Docker socket hardening — Portainer requires access to the Docker socket and that access is currently unrestricted
- Authelia SSO on individual subdomains (Pi-hole, Grafana, Portainer, Netdata, Uptime Kuma)
- Network segmentation
- CrowdSec Pushover alerts

---

## Report Metadata

**Author:** Sean Magee
**Contact:** sean@magee.pro
**Date:** March 14, 2026
**Version:** 1.0
**Classification:** Public / Educational

**Disclosure:** This report was prepared for educational purposes as part of ongoing cybersecurity study and homelab development. All findings and configurations reflect a personal lab environment. Specific port numbers and internal addresses have been redacted and replaced with placeholders.

**License:** This report may be shared for educational and defensive security purposes with proper attribution.

---

## References

1. Google Authenticator PAM — https://github.com/google/google-authenticator-libpam
2. UFW Documentation — https://help.ubuntu.com/community/UFW
3. Tailscale Documentation — https://tailscale.com/kb
4. Portainer Documentation — https://docs.portainer.io
5. MITRE ATT&CK Framework — https://attack.mitre.org/
