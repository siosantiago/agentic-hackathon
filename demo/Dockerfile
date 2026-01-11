# Fast startup Dockerfile - pre-builds Frappe LMS image
# Build with: docker compose build
# Run with: docker compose up -d (starts in ~30 seconds!)

FROM frappe/bench:latest

WORKDIR /home/frappe

# Cache busting for rebuilds
ARG BUILD_DATE=1

# Pre-initialize bench
RUN bench init --skip-redis-config-generation frappe-bench

WORKDIR /home/frappe/frappe-bench

# Configure for container environment
RUN bench set-mariadb-host mariadb && \
    bench set-redis-cache-host redis://redis:6379 && \
    bench set-redis-queue-host redis://redis:6379 && \
    bench set-redis-socketio-host redis://redis:6379 && \
    sed -i '/redis/d' ./Procfile && \
    sed -i '/watch/d' ./Procfile

# Pre-download LMS app
RUN bench get-app lms

# Create site initialization script
RUN echo '#!/bin/bash' > /home/frappe/init-site.sh && \
    echo 'cd /home/frappe/frappe-bench' >> /home/frappe/init-site.sh && \
    echo 'if [ ! -f "/home/frappe/frappe-bench/sites/lms.localhost/site_config.json" ]; then' >> /home/frappe/init-site.sh && \
    echo '  echo "Creating site lms.localhost..."' >> /home/frappe/init-site.sh && \
    echo '  bench new-site lms.localhost --force --mariadb-root-password 123 --admin-password admin --no-mariadb-socket' >> /home/frappe/init-site.sh && \
    echo '  bench --site lms.localhost install-app lms' >> /home/frappe/init-site.sh && \
    echo '  bench --site lms.localhost set-config developer_mode 1' >> /home/frappe/init-site.sh && \
    echo '  bench --site lms.localhost clear-cache' >> /home/frappe/init-site.sh && \
    echo '  bench use lms.localhost' >> /home/frappe/init-site.sh && \
    echo 'fi' >> /home/frappe/init-site.sh && \
    echo 'bench start' >> /home/frappe/init-site.sh && \
    chmod +x /home/frappe/init-site.sh

CMD ["/home/frappe/init-site.sh"]
