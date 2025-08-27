---
title: "Route VPN Traffic"
date: "2020-08-26T00:00:00Z"
description: "How to route network traffic through a VPN connection on another machine using Linux networking tools"
summary: "Setting up traffic routing through a VPN on another laptop when hardware fails but VPN access is still needed"
categories: ["linux"]
---

This post describes how I set up traffic routing through a VPN connection on another machine when my primary laptop's hardware failed but could still connect to the required VPN.

# Context

My personal laptop, my beloved Dell XPS 15, broke down. The SSD was not being detected. Fixing it would take time and I thought I'd get it fixed when I had less workload.

Now as part of my work, I need to connect to a VPN. The VPN solution is [Palo Alto's GlobalProtect VPN](https://www.paloaltonetworks.com/products/globalprotect) :sweat_smile: (I'll rant about GlobalProtect VPN some other time!).

I can only connect to the VPN using my Dell XPS as its MAC address was registered. I had another laptop available (ThinkPad E470), but the process to get this new laptop's MAC address registered would take around 2 weeks!

Using an ArchLinux LiveUSB, I was able to check that I could connect to the VPN from the XPS. However, my SSD was not being detected. To get back to work quickly, I thought I could figure out a way to route the traffic from the ThinkPad laptop through the Dell XPS laptop (while it was connected to the VPN).

# Solution

Using the `getent` command, on the Dell XPS, I got the IP address of the hosts I wanted to route using the VPN.

```bash
$ getent hosts git.example.com
172.17.1.174     git.example.com
```

I stored the entries in the `/etc/hosts` file on the ThinkPad laptop.

Also, had to make sure the Dell XPS laptop was able to forward traffic and setup iptables to do NAT.

```bash
# Enable IP forwarding on the Dell XPS to allow packet routing
$ sudo sysctl -w net.ipv4.ip_forward=1

# Set up NAT to masquerade traffic going out through the VPN interface
$ sudo iptables -t nat -A POSTROUTING -o gpd0 -j MASQUERADE
```
*(Note: `gpd0` is the GlobalProtect VPN interface created when connected to the VPN)*

Now, to actually route the traffic from the ThinkPad (client) through the Dell XPS (VPN gateway):

```bash
$ sudo ip route add 172.17.1.174 via 192.168.31.60
```

In this command, the IP `172.17.1.174` is the IP that we want to be routed through the VPN. The IP `192.168.31.60` is the IP address of the Dell XPS. Since I already have the entry in the `/etc/hosts` file, I am done.

Browse to git.example.com, and voilà. Everything works as expected! :smile:

# References

These resources helped me understand the networking concepts and commands needed:

1. [Routing traffic through VPN in VM setup](https://unix.stackexchange.com/questions/511967/how-to-route-traffic-through-vpn-only-accessible-within-vm-without-a-bridged-ad)
2. [Routing traffic through VPN on another computer](https://superuser.com/questions/1061363/how-to-route-traffic-through-a-vpn-that-is-only-available-through-another-comput)
3. [Route machine traffic through another within subnet](https://askubuntu.com/questions/907972/route-all-traffic-of-a-machine-through-another-within-a-subnet)

Also helpful: man pages for `sysctl`, `iptables`, and `ip route`
