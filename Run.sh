#!/bin/bash
set -e

# === Load Configuration ===
source ./config.txt

# === Ensure DB Path Exists ===
mkdir -p "$DBPATH"

# === START MONGODB ===
echo "🚀 Starting MongoDB server..."
"$MONGO_BIN" --dbpath "$DBPATH" --fork --logpath "$DBPATH/mongod.log"
sleep 5  # Let MongoDB start properly

# === START NODE SERVER ===
echo "🚀 Starting Node.js API server..."
node "$API_SERVER"

# (Optional) If you want Node to run *in the background* too, you can do:
# nohup node "$API_SERVER" > ./api/server.log 2>&1 &
# echo "Node.js server running in background."

echo "🎉 Both MongoDB and API server started!"
