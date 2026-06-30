# Production Deployment Guide - Astra AI

This document details how to host Astra AI in a production environment using Linux servers (e.g. Ubuntu 22.04 LTS), Gunicorn process managers, Nginx proxies, and cloud PostgreSQL databases.

---

## 💾 1. PostgreSQL Database Configuration

For production, do not use the local SQLite fallback. Use a managed database service:
- **Options**: AWS RDS PostgreSQL, Supabase, or digitalOcean Databases.
- **Connection URL**: Set `DATABASE_URL` in `.env` to `postgresql://<user>:<password>@<host>:<port>/<dbname>?sslmode=require`.

---

## 🐍 2. Backend FastAPI Server Hosting

### A. Environment Variables (`.env`)
Create a production `.env` file in `/var/www/astra/backend/.env`:
```ini
DATABASE_URL=postgresql://db_user:secure_pwd@db_host:5432/astra_prod
SECRET_KEY=generate_a_secure_long_random_hex_string_using_openssl
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
OPENAI_API_KEY=sk-proj-...
GEMINI_API_KEY=AIzaSy...
```

### B. Process Manager (Systemd)
To ensure the backend runs in the background and restarts automatically on crash, set up a Systemd service.

1. Create a service file:
   ```bash
   sudo nano /etc/systemd/system/astra-backend.service
   ```
2. Insert configuration:
   ```ini
   [Unit]
   Description=Astra AI FastAPI Gateway service
   After=network.target

   [Service]
   User=www-data
   WorkingDirectory=/var/www/astra/backend
   ExecStart=/var/www/astra/backend/venv/bin/gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 127.0.0.1:8000
   Restart=always
   EnvironmentFile=/var/www/astra/backend/.env

   [Install]
   WantedBy=multi-user.target
   ```
3. Start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl start astra-backend
   sudo systemctl enable astra-backend
   ```

---

## 🌐 3. Nginx Reverse Proxy & SSL Setup

Nginx will serve the static React assets directly and proxy `/api` calls to Gunicorn (FastAPI).

### A. Nginx Configuration
1. Create a new site config:
   ```bash
   sudo nano /etc/nginx/sites-available/astra.conf
   ```
2. Insert routing parameters:
   ```nginx
   server {
       listen 80;
       server_name astra.ai www.astra.ai; # Replace with your domains

       # React static files root
       root /var/www/astra/frontend/dist;
       index index.html;

       location / {
           try_files $uri $uri/ /index.html;
       }

       # Proxy API requests to backend gunicorn server
       location /api {
           proxy_pass http://127.0.0.1:8000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           
           # Extend timeouts for long-running streaming/SSE chat generations
           proxy_read_timeout 300s;
           proxy_send_timeout 300s;
       }
   }
   ```
3. Enable configuration and test Nginx:
   ```bash
   sudo ln -s /etc/nginx/sites-available/astra.conf /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### B. Secure SSL Certificates (Let's Encrypt Certbot)
To enable HTTPS secure endpoints:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d astra.ai -d www.astra.ai
```
*Certbot will configure redirect parameters automatically.*

---

## ⚛️ 4. Frontend Client Deployment

Compile React client files to static HTML/CSS blocks:
1. Navigate to `/var/www/astra/frontend`.
2. Clean run build script:
   ```bash
   npm install
   npm run build
   ```
3. This creates a `dist/` directory that matches the `root` path specified in Nginx configurations above.
4. For high-availability CDN deployments, you can deploy the compiled `dist/` directory directly to Vercel, Netlify, or AWS S3.
