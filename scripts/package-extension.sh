#!/bin/bash

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Get version from manifest.json
VERSION=$(grep '"version"' src/manifest.json | cut -d'"' -f4)

# Clean dist directory and remove any existing release files
rm -rf dist
rm -f claude-extension-v*.zip

# Run production build
npm run build

# Create zip file for distribution
cd dist
zip -r ../claude-extension-v${VERSION}.zip *

echo "Extension packaged successfully! The zip file claude-extension-v${VERSION}.zip is ready for GitHub release."
echo "To create a GitHub release:"
echo "1. git tag v${VERSION}"
echo "2. git push origin v${VERSION}"
echo "3. Upload claude-extension-v${VERSION}.zip to the GitHub release"
