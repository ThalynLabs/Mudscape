# Mudscape Server Installation Guide

This guide covers deploying Mudscape on a VPS or dedicated server for multi-user access.

## Requirements

- **OS**: Ubuntu 22.04+ / Debian 12+ / Rocky Linux 9+ (or any Linux with systemd)
- **RAM**: 1GB minimum, 2GB recommended
- **Node.js**: v18+ 
- **PostgreSQL**: 14+
- **Domain** (optional): For HTTPS access

## Quick Start

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/mudscape.git
cd mudscape

# Install dependencies
npm install

# Copy and edit environment file
cp .env.example .env
nano .env

# Initialize database
npm run db:push

# Start the server
npm run dev
```

## Detailed Installation

### 1. Install Node.js

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be v18+
npm --version
```

### 2. Install PostgreSQL

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres createdb mudscape
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'your_secure_password';"
```

### 3. Clone and Configure

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/mudscape.git
cd mudscape

# Install dependencies
npm install

# Create environment file
cat > .env << EOF
DATABASE_URL=postgresql://postgres:your_secure_password@localhost:5432/mudscape
SESSION_SECRET=$(openssl rand -base64 48)
PORT=5000
NODE_ENV=production
EOF

# Initialize database tables
npm run db:push
```

### 4. Build for Production

```bash
npm run build
```

### 5. Create Systemd Service

```bash
sudo nano /etc/systemd/system/mudscape.service
```

Add the following content:

```ini
[Unit]
Description=Mudscape MUD Client
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/mudscape
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable mudscape
sudo systemctl start mudscape
sudo systemctl status mudscape
```

## Reverse Proxy Setup

### Nginx

```bash
sudo apt install nginx
sudo nano /etc/nginx/sites-available/mudscape
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Important for Socket.IO
        proxy_read_timeout 86400;
    }

    # Socket.IO specific path
    location /api/socket {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/mudscape /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SESSION_SECRET` | Random string for session security | Required |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `SINGLE_USER_MODE` | Disable authentication | `false` |

## Docker Deployment

### docker-compose.yml

```yaml
version: '3.8'

services:
  mudscape:
    build: .
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=postgresql://postgres:mudscape@db:5432/mudscape
      - SESSION_SECRET=${SESSION_SECRET:-changeme}
      - NODE_ENV=production
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=mudscape
      - POSTGRES_DB=mudscape
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  pgdata:
```

### Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

Run with:

```bash
# Generate a session secret
export SESSION_SECRET=$(openssl rand -base64 48)

# Start containers
docker-compose up -d

# Initialize database
docker-compose exec mudscape npm run db:push
```

## Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

## Updating

```bash
cd /path/to/mudscape
git pull origin main
npm install
npm run build
sudo systemctl restart mudscape
```

## Backup

### Database Backup

```bash
# Backup
pg_dump mudscape > mudscape_backup_$(date +%Y%m%d).sql

# Restore
psql mudscape < mudscape_backup_YYYYMMDD.sql
```

### Automated Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * pg_dump mudscape > /backups/mudscape_$(date +\%Y\%m\%d).sql
```

## Monitoring

### View Logs

```bash
# Systemd logs
sudo journalctl -u mudscape -f

# Last 100 lines
sudo journalctl -u mudscape -n 100
```

### Health Check

```bash
curl http://localhost:5000/api/auth/status
```

## Troubleshooting

### Connection Issues

1. Check if the service is running:
   ```bash
   sudo systemctl status mudscape
   ```

2. Check if the port is listening:
   ```bash
   ss -tlnp | grep 5000
   ```

3. Check logs for errors:
   ```bash
   sudo journalctl -u mudscape -n 50
   ```

### Database Connection Failed

1. Verify PostgreSQL is running:
   ```bash
   sudo systemctl status postgresql
   ```

2. Test database connection:
   ```bash
   psql -U postgres -d mudscape -c "SELECT 1;"
   ```

3. Check DATABASE_URL in .env matches your PostgreSQL credentials

### Socket.IO Not Connecting

1. Ensure Nginx is configured with WebSocket support
2. Check that `/api/socket` path is proxied correctly
3. Verify `proxy_read_timeout` is set high enough for long-polling

## Multi-User Setup

For multi-user mode, the first user to register becomes the admin. Admins can:
- Manage user accounts
- Enable/disable registration
- Promote other users to admin

Access admin settings at: `https://your-domain.com/admin`

## Security Recommendations

1. **Use HTTPS** - Always use SSL in production
2. **Strong SESSION_SECRET** - Use `openssl rand -base64 48` to generate
3. **Database password** - Use a strong, unique password
4. **Firewall** - Only expose necessary ports (80, 443)
5. **Updates** - Keep the system and dependencies updated
6. **Backups** - Regular automated database backups
