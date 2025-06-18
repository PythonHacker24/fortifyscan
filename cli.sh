#!/usr/bin/env bash

set -e

REPO="PythonHacker24/fortifyscan"
VERSION="v1.0.0"
BINARY_NAME="raincheck"

OS=$(uname -s | tr '[:upper:]' '[:lower:]')
ARCH=$(uname -m)

# Normalize architecture names
case "$ARCH" in
  x86_64) ARCH="amd64" ;;
  arm64|aarch64) ARCH="arm64" ;;
  *) echo "Unsupported arch: $ARCH"; exit 1 ;;
esac

URL="https://github.com/$REPO/releases/download/$VERSION/${BINARY_NAME}-${OS}-${ARCH}"
DEST="/usr/local/bin/$BINARY_NAME"

# Use sudo if needed
if [ ! -w $(dirname $DEST) ]; then
  SUDO="sudo"
fi

echo "Downloading $URL..."
curl -L "$URL" -o "$BINARY_NAME"
chmod +x "$BINARY_NAME"
$SUDO mv "$BINARY_NAME" "$DEST"

echo "Installed $BINARY_NAME to $DEST"
