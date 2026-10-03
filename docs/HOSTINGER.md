# Deploying to a Hostinger VPS

This runs the whole site (pages, all `api/` functions and the daily cron jobs) on one
Hostinger VPS using `server/index.mjs`, instead of Vercel.

**Plan:** KVM 1 (1 vCPU, 4 GB RAM) is enough. Choose **Ubuntu 24.04** as the OS and a
server location in **India** (Mumbai) if offered.

Vercel keeps serving the live site until step 8, so nothing breaks while you set this up.

---

## 1. Log in to the server

In hPanel → **VPS** → your server, click **Browser terminal** (or use SSH:
`ssh root@YOUR_SERVER_IP`). Run every command below in that terminal.

## 2. Install Node.js, Git, Nginx and PM2

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs git nginx
npm install -g pm2
```

## 3. Get the code

The GitHub repo is private, so give the server a read-only **deploy key**:

```bash
ssh-keygen -t ed25519 -N "" -f ~/.ssh/github_deploy
cat ~/.ssh/github_deploy.pub
```

Copy the line it prints. On GitHub open **lasafinancial/lasafinancedashboard → Settings →
Deploy keys → Add deploy key**, paste it, leave "Allow write access" **off**, save. Then:

```bash
printf "Host github.com\n  IdentityFile ~/.ssh/github_deploy\n" >> ~/.ssh/config
git clone git@github.com:lasafinancial/lasafinancedashboard.git /var/www/lasa
cd /var/www/lasa
npm ci
```

## 4. Add the secrets (.env)

Copy every environment variable from **Vercel → Project → Settings → Environment
Variables** into a new file:

```bash
nano /var/www/lasa/.env
```

One per line, `NAME=value`. Use the exact names from Vercel (for example
`GOOGLE_SERVICE_ACCOUNT_KEY_BASE64`, `FIREBASE_SERVICE_ACCOUNT_KEY`, `RAZORPAY_KEY_ID`,
`RAZORPAY_KEY_SECRET`, `VITE_RAZORPAY_KEY_ID`, `TWILIO_*`, `ADMIN_SECRET`, `CRON_SECRET`,
all `VITE_FIREBASE_*` and `VITE_GEMINI_API_KEY`). Then add:

```
PORT=3000
ENABLE_CRON=false
```

Save with **Ctrl+O, Enter, Ctrl+X**. Keep the cron jobs off until step 8, otherwise
users get each daily notification twice (once from Vercel, once from here).

> `CRON_SECRET` must be set. The cron endpoints compare against it.

## 5. Build and start

```bash
cd /var/www/lasa
npm run build
pm2 start npm --name lasa -- start
pm2 save
pm2 startup   # run the command it prints, so the site restarts after a reboot
```

Check it: `pm2 logs lasa` should show `Mounted 13 functions` and `Listening on
http://127.0.0.1:3000`. Press Ctrl+C to leave the logs.

## 6. Put Nginx in front (handles the domain, HTTPS and compression)

```bash
cat > /etc/nginx/sites-available/lasa <<'EOF'
server {
    listen 80;
    server_name lasaresearch.in www.lasaresearch.in;

    gzip on;
    gzip_types application/json application/javascript text/css image/svg+xml;
    gzip_min_length 1024;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300s;   # /api/fetch-data can take ~2 minutes on a cold start
    }
}
EOF
ln -s /etc/nginx/sites-available/lasa /etc/nginx/sites-enabled/lasa
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
```

**Test before switching the domain:** open `http://YOUR_SERVER_IP` in a browser. The site
should load. The first data load can take up to two minutes.

## 7. Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## 8. Switch the domain (go live)

1. In your domain's DNS settings, change the **A records** for `lasaresearch.in` and
   `www.lasaresearch.in` to your VPS IP, and remove any Vercel `CNAME`/`A` records for them.
2. Wait until `http://www.lasaresearch.in` shows the site from the VPS (usually minutes,
   can take a few hours).
3. Turn on HTTPS:
   ```bash
   apt install -y certbot python3-certbot-nginx
   certbot --nginx -d lasaresearch.in -d www.lasaresearch.in
   ```
4. Turn on the cron jobs here, and **remove them on Vercel** (delete the `crons` section of
   `vercel.json` or pause the Vercel project):
   ```bash
   sed -i 's/^ENABLE_CRON=false/ENABLE_CRON=true/' /var/www/lasa/.env
   pm2 restart lasa
   ```
5. Check payments (Razorpay), OTP login and notifications still work.

## 9. The Android app

The app calls the API at the address in `src/config/api.ts` (`PRODUCTION_URL`,
currently `https://lasafinance.vercel.app`). Before shutting Vercel down, change it to
`https://www.lasaresearch.in`, rebuild the app and publish the update, or the installed
app stops getting data.

---

## Updating the site later

After new code is pushed to GitHub:

```bash
cd /var/www/lasa
git pull
npm ci
npm run build
pm2 restart lasa
```

## Useful commands

| What | Command |
|---|---|
| See live logs | `pm2 logs lasa` |
| Restart | `pm2 restart lasa` |
| Status / memory use | `pm2 status` |
| Renew HTTPS (automatic, to test) | `certbot renew --dry-run` |
