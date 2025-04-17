#!/bin/bash
set -e

# === Load Configuration ===
source ./config.txt

# === Ensure DB Path Exists ===
mkdir -p "$DBPATH"

# === START MONGODB IN NEW TERMINAL ===
echo "🚀 Starting MongoDB server in new terminal..."
gnome-terminal -- bash -c \
"\"$MONGO_BIN/mongod\" --dbpath \"$DBPATH\"; exec bash"

# Give MongoDB time to start
sleep 3

# === START NODE SERVER ===
echo "🚀 Starting Node.js API server in current terminal..."
cd api
node server.js

echo "🎉 Servers started in separate terminals!"
