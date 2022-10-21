---
categories:
- linux
- docker
date: "2018-12-30T00:00:00Z"
title: Configuring Postfix
---
I came across this really neat Docker image
[docker-postfix](https://github.com/catatnight/docker-postfix). It got me up
and running with Postfix in a very short amount of time.

I'm just mentioning the extra steps I had to take to get the TLS certificates
and the DKIM keys. As this is a post of configuring Postfix running as a
**Docker** container, I'll also run all the setup steps inside containers.

First let's create a directory for all our files and pull all the images

```bash
mkdir -p ~/postfix
docker pull certbot/dns-cloudflare
docker pull ubuntu
docker pull catatnight/postfix
```

Now let's generate the keys. You can use
[certbot](https://github.com/certbot/certbot) which also has instructions on
[running with docker](
https://certbot.eff.org/docs/install.html#running-with-docker). In my case, I
had the domain on Cloudflare, so I used the [dns-cloudflare plugin](
https://certbot-dns-cloudflare.readthedocs.io/en/stable/) which is available as
an image [dns-cloudflare](
https://hub.docker.com/r/certbot/dns-cloudflare).

```bash
mkdir -p ~/postfix/letsencrypt/etc
mkdir -p ~/postfix/letsencrypt/lib

# Add your email and token
cat <<EOF > ~/postfix/letsencrypt/cloudflare.ini
dns_cloudflare_email = cloudflare@example.com
dns_cloudflare_api_key = 0123456789abcdef0123456789abcdef01234567
EOF

# Add your email where you want to recieve emails from LetsEncypt and the
# domain for the mail
docker run -it --rm \
--name certbot \
-v "$HOME/postfix/letsencrypt/etc:/etc/letsencrypt" \
-v "$HOME/postfix/letsencrypt/lib:/var/lib/letsencrypt" \
-v "$HOME/postfix/letsencrypt/cloudflare.ini:/tmp/cloudflare.ini:ro" \
certbot/dns-cloudflare certonly \
--agree-tos \
--dns-cloudflare \
--dns-cloudflare-credentials /tmp/cloudflare.ini \
--dns-cloudflare-propagation-seconds 60 \
--manual-public-ip-logging-ok \
--no-eff-email \
--renew-by-default
--text \
--email admin@example.com \
-d mail.example1.com

# Now we'll copy the generated certs to the proper location
mkdir -p "$HOME/postfix/certs"
cp /etc/letsencrypt/archive/mail.example.com/fullchain*.pem "$HOME/postfix/certs/mail.example.com.crt"
cp /etc/letsencrypt/archive/mail.example.com/privkey*.pem "$HOME/postfix/certs/mail.example.com.key"
```

Now we'll generate the DKIM keys

```bash
docker run -it --rm \
--name dkim \
-v "$HOME/postfix/dkim-tools:/data" \
ubuntu \
bash

# The following command will run inside the container
apt update && apt install opendkim-tools -y
cd /data
opendkim-genkey --selector=mail --domain=mail.example1.com

# Exit from the container
exit

cp "$HOME/postfix/dkim-tools/mail.private" "$HOME/postfix/keys/"
cp "$HOME/postfix/dkim-tools/mail.txt" "$HOME/postfix/keys/"
cd "$HOME/postfix/keys/"
chown opendkim:opendkim mail.private
```

Now we have to add the DNS entry. If you take the look at the `mail.txt`, like

```bash
cat mail.txt
# OUTPUT
mail._domainkey IN      TXT     ( "v=DKIM1; k=rsa; "
          "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC2JynHFdaFJ+3esWnV3/ayG0rRAb8AxWa900ffYV22bpEYTO7WXAy5w1igWAEmtyzeRDlEngZAhw3GVQWsmSkydMTIvTNG9P1qXC+q23bxpq3yxxy8urqw42QusYV9n6HbU6dI6iNz0HJplQ95T6FFi7YAgzN8wuNCON0n9h9WSwIDAQAB" )  ; ----- DKIM key mail for mail.example.com
```

You will have to add the TXT entry in your domain's DNS records.


For SPF record, you need to add the following as the value of a TXT entry for
the domain. The key in our example will be mail.example.com. The IP 1.1.1.1 will
be replaced by the public IP address of the instance.

```
v=spf1 a include:_spf.google.com ip4:1.1.1.1 ~all
```

For multiple IP address, just repeat the `ip4` block.

```
v=spf1 a include:_spf.google.com ip4:1.1.1.1 ip4:2.2.2.2 ~all
```


Lastly, we'll run the postfix container itself and run it in daemon mode.

```bash
docker run -p 25:25 \
-e maildomain=mail.example.com -e smtp_user=user1:mySecretPassword \
-v "$HOME/postfix/keys:/etc/opendkim/domainkeys" \
-v "$HOME/postfix/certs:/etc/postfix/certs" \
--name postfix -d catatnight/postfix
```

We'll now you just need to point whatever application you use to port 25, with
the SMTP credentials `user1:mySecretPassword`. Enjoy emails that have a [good score](
https://www.mail-tester.com) and won't land up in spam!
