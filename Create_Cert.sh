#!/bin/bash

# Exit if any command fails
set -e

# Move into the target directory
cd "/api/cert" || { echo "Directory not found!"; exit 1; }

# Create the certificate
sudo openssl req -newkey rsa:4096 -nodes -keyout server.key -x509 -days 3650 -out server.crt -subj "/CN=localhost"

# Fix ownership (in case of permission issues)
sudo chown user:user server.crt server.key

# Set file permissions
chmod 600 server.key
chmod 644 server.crt

echo "✅ Certificate and keys created successfully!"
