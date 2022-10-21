---
categories:
- linux
- docker
date: "2018-08-14T00:00:00Z"
title: Postfix in a container
---
Postfix is a service which forks itself and runs in the background. Postfix
version [3.3.0 added container support][1].
There was an issue where Postfix could not run as _PID=1_, and it was swiftly
[fixed in version 3.3.1][2]

As I could not find any official Docker image for the latest versin of Postfix,
I decided to build one myself. At the time I built the image, there was no
Debian package available so I had to compile the package [from source][3].

Here is the link to [the Dockerfile][4].

You can build the docker image yourselves and use it too. Just run

```bash
git clone https://github.com/EasyEngine/dockerfiles.git
cd postfix
docker build -t postfix .

# Now run the docker image using
docker run \
-h example.com \
-p 1025:25 \
-v "/dev/log:/dev/log"
postfix
```

Now you can point in the smtp settings to use `localhost:1025`. The logs will
be available at `/var/log/mail.log` on your host.

[1]: http://www.postfix.org/announcements/postfix-3.3.0.html
[2]: http://www.postfix.org/announcements/postfix-3.3.1.html
[3]: http://cdn.postfix.johnriley.me/mirrors/postfix-release/index.html
[4]: https://github.com/EasyEngine/dockerfiles/blob/master/postfix/Dockerfile
