---
title: "Backup files to git repo before shutdown"
date: "2020-07-24T00:00:00Z"
description: "Automated solution to backup dotfiles and work files to a git repository using systemd services before system shutdown"
summary: "Simple setup to automatically push important files to a remote git repository before shutting down the system"
slug: backup-work-git
categories:
- linux
---

I have a few files that I want to push to a remote repository just before shutdown. It could be many use cases, but mine is, I want my dotfiles synced to [mbtamuli/dotfiles](https://github.com/mbtamuli/dotfiles).

Well, the approach is simple
- setup a small script to do git push
- have a systemd service
- What? You thought there'd be a ton of steps? Sorry to dissapoint. :grin:
- profit! :sunglasses:

Create another file and do whatever you need `/usr/local/bin/backup_work.sh`
```
#!/bin/bash

cd /path/to/git/repo
git add .
git commit -m "Daily Backup"
git push origin master
```

Add executable permissions
```
chmod +x /usr/local/bin/backup_work.sh
```

Create a file at `/etc/systemd/system/backup-work.service`. Change the user and group!
```
[Unit]
Description=Backup files to git repo
DefaultDependencies=no
Before=shutdown.target reboot.target halt.target

[Service]
Type=oneshot
User=mbtamuli
Group=mbtamuli
ExecStart=/usr/local/bin/backup_work.sh

[Install]
WantedBy=halt.target reboot.target shutdown.target
```
