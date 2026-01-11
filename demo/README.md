# Frappe LMS Docker Setup

Fast setup with pre-built image for <3 minute startup.

## Quick Start

```bash
# Build image once (takes ~10 minutes)
docker compose build

# Start in ~30 seconds!
docker compose up -d

# Access at http://localhost:8000/lms
```

## Startup Times

| Action | Time |
|--------|------|
| Build image (one-time) | ~10 minutes |
| First run (after build) | ~30 seconds |
| Subsequent runs | ~30 seconds |

## Login

- Username: `Administrator`
- Password: `admin`

## Rebuilding

To update LMS or force rebuild:

```bash
docker compose build --no-cache
docker compose up -d
```

## Standard Setup (Slower, No Build)

If you prefer the standard 5-minute setup without building:

```bash
# Use the original simple setup
mv docker-compose.yml docker-compose.fast.yml
# Download official setup
wget -O docker-compose.yml https://raw.githubusercontent.com/frappe/lms/develop/docker/docker-compose.yml
wget -O init.sh https://raw.githubusercontent.com/frappe/lms/develop/docker/init.sh
docker compose up -d  # Takes ~5 minutes
```

## Performance Tips

See [PERFORMANCE.md](PERFORMANCE.md) for detailed optimization strategies.
