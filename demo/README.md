# Frappe LMS Docker Setup

Quick development setup for Frappe LMS using Docker.

## Usage

1. Start the containers:
```bash
docker compose up -d
```

2. Wait for the initial setup to complete (~10 minutes on first run):
   - Initializes bench
   - Clones and installs LMS app
   - Creates and configures the site

3. Access the site:
   - http://localhost:8000/lms
   - http://lms.localhost:8000/lms

## Login

- Username: `Administrator`
- Password: `admin`

## Restarting

After the first run, the site will start immediately:
```bash
docker compose restart frappe
```

## Logs

View initialization progress:
```bash
docker compose logs -f frappe
```
