#!/bin/bash

# Exit if any command fails
set -e

# Configuration
TARGET_DIR="./api/cert"
CERT_FILE="server.crt"
KEY_FILE="server.key"
SUBJECT="/CN=localhost"
DAYS=3650

# Create directory if it doesn't exist
mkdir -p "$TARGET_DIR" || { echo "Failed to create directory $TARGET_DIR"; exit 1; }

# Move into the target directory
cd "$TARGET_DIR" || { echo "Failed to enter directory $TARGET_DIR"; exit 1; }

# Check if files already exist to prevent overwriting
if [ -f "$CERT_FILE" ] || [ -f "$KEY_FILE" ]; then
    echo "⚠️  Warning: Certificate or key file already exists in $TARGET_DIR"
    echo "   Delete them first or choose a different directory if you want to generate new ones."
    exit 1
fi

# Create the certificate
openssl req -newkey rsa:4096 -nodes -keyout "$KEY_FILE" -x509 -days "$DAYS" -out "$CERT_FILE" -subj "$SUBJECT"

# Set file permissions
chmod 600 "$KEY_FILE"
chmod 644 "$CERT_FILE"

echo "✅ Certificate and keys created successfully in $TARGET_DIR!"
echo "   Certificate: $CERT_FILE"
echo "   Key:         $KEY_FILE"
