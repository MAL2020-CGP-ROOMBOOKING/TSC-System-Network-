#!/bin/bash
set -e

# === CONFIGURATION ===
MONGO_VERSION="6.0.4"
MONGO_URL="https://fastdl.mongodb.org/linux/mongodb-linux-x86_64-ubuntu2204-${MONGO_VERSION}.tgz"

MONGOSH_VERSION="1.10.1"
MONGOSH_URL="https://downloads.mongodb.com/compass/mongosh-${MONGOSH_VERSION}-linux-x64.tgz"

DB_NAME="ShipRoomsReservation"
COLLECTION_NAME="admin"
JSON_FILE="./database/data.json"  # adjust if your file name is different

DBPATH="./data/db"
MONGO_DIR="./mongod"
MONGOSH_DIR="./mongosh"
MONGO_BIN="$MONGO_DIR/bin"
MONGOSH_BIN="$MONGOSH_DIR/bin"

mkdir -p "$DBPATH"

# === FUNCTIONS ===

download_and_extract() {
    echo "⏬ Downloading MongoDB server..."
    wget -O mongodb.tgz "$MONGO_URL"
    tar -xzf mongodb.tgz
    mv mongodb-linux-* "$MONGO_DIR"
    rm mongodb.tgz
    echo "✅ MongoDB server ready."

    echo "⏬ Downloading Mongo Shell (mongosh)..."
    wget -O mongosh.tgz "$MONGOSH_URL"
    tar -xzf mongosh.tgz
    mv mongosh-* "$MONGOSH_DIR"
    rm mongosh.tgz
    echo "✅ Mongo Shell ready."
}

start_mongod() {
    echo "🚀 Starting MongoDB server..."
    "$MONGO_BIN/mongod" --dbpath "$DBPATH" --fork --logpath "$DBPATH/mongod.log"
    sleep 5  # give it time to fully start
}

setup_database() {
    echo "⚙️ Creating database '$DB_NAME' and collection '$COLLECTION_NAME'..."
    "$MONGOSH_BIN/mongosh" <<EOF
use $DB_NAME
db.createCollection("$COLLECTION_NAME")
EOF
}

import_data() {
    echo "📦 Importing JSON data into '$DB_NAME.$COLLECTION_NAME'..."
    "$MONGO_BIN/mongoimport" --db "$DB_NAME" --collection "$COLLECTION_NAME" --file "$JSON_FILE" --jsonArray
}

# === MAIN SCRIPT ===

echo "🚀 MongoDB Portable Installer Script Started"

download_and_extract
start_mongod
setup_database
import_data

echo "🎉 All operations completed successfully!"
read -p "Press [Enter] to close..."
