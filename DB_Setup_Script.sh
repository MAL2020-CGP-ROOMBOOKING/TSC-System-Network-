#!/bin/bash
set -e

# === Load Config ===
source ./config.txt
mkdir -p "$DBPATH"

# === 1. Download MongoDB & Tools ===
echo "⏬ Downloading MongoDB..."
wget -O mongo.tgz "$MONGO_URL"
tar -xzf mongo.tgz --one-top-level=mongodb --strip-components=1
echo "✅ MongoDB downloaded."

echo "⏬ Downloading MongoDB Tools..."
wget -O tools.tgz "$MONGO_TOOLS_URL"
tar -xzf tools.tgz --one-top-level=mongodb-tools --strip-components=1
echo "✅ MongoDB Tools downloaded."

# === 2. Start MongoDB Server ===
echo "🚀 Starting MongoDB..."
"$MONGO_BIN/mongod" --dbpath "$DBPATH" --fork --logpath "$DBPATH/mongod.log"
sleep 3  # Wait for server to start

# === 3. Import Data ===
echo "📦 Importing data from '$JSON_FILE'..."
"$MONGO_TOOLS_BIN/mongoimport" \
    --db "$DB_NAME" \
    --collection "$COLLECTION_NAME" \
    --file "$JSON_FILE" \
    --jsonArray \
    --drop  # Optional: Drops collection if it exists
echo "✅ Data imported successfully!"

# === Done ===
echo "🎉 MongoDB setup complete!"
echo "   Database: '$DB_NAME'"
echo "   Collection: '$COLLECTION_NAME'"
echo "   Data will persist after this script exits"
echo ""
$MONGO_BIN/mongod --dbpath $DBPATH --shutdown
