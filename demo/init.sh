#!/bin/bash

# This is a minimal init.sh for backwards compatibility
# The real setup happens in Dockerfile.fast

echo "Starting Frappe LMS..."
/home/frappe/init-site.sh
