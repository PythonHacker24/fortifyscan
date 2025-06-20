#!/usr/bin/env bash

set -e

BINARY_NAME="raincheck"
OUTPUT_DIR="bin"

mkdir -p "$OUTPUT_DIR"

platforms=(
  "linux/amd64"
  "linux/arm64"
  "darwin/amd64"
  "darwin/arm64"
)

for platform in "${platforms[@]}"; do
  IFS="/" read -r GOOS GOARCH <<< "$platform"
  output_name="${BINARY_NAME}-${GOOS}-${GOARCH}"
  echo "Building for $GOOS/$GOARCH -> $OUTPUT_DIR/$output_name"
  GOOS=$GOOS GOARCH=$GOARCH go build -o "${OUTPUT_DIR}/${output_name}"
done

echo "All builds completed."
