#!/bin/bash
echo "=== Word Harmony Setup ==="

# Install server deps
echo "Installing server dependencies..."
npm install

# Install and build client
echo "Installing client dependencies..."
cd client && npm install

echo "Building React app..."
npm run build
cd ..

echo "=== Starting Word Harmony Server ==="
node server/index.js
