#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting automated release process..."

# 1. First, save any uncommitted changes you have made
if [[ $(git status --porcelain) ]]; then
  echo "📦 Committing current changes..."
  git add .
  git commit -m "automated updates prior to release"
fi

# 2. Automatically bump the version (1.0.0 -> 1.0.1) and create a git tag
echo "📈 Bumping application version..."
npm version patch

# Get the new version string (e.g., "1.0.1")
NEW_VERSION=$(node -p "require('./package.json').version")
echo "✅ Version updated to v$NEW_VERSION"

# 3. Build the new DMG file
echo "🔨 Building new DMG package..."
npm run dist:dmg

# 4. Push the new code and version tags to GitHub
echo "☁️ Pushing code to GitHub..."
git push
git push --tags

# 5. Upload the built DMG to a new GitHub Release page
echo "🎉 Creating GitHub Release v$NEW_VERSION..."
gh release create "v$NEW_VERSION" "/Users/shithel/Downloads/AION Battery Releases/AION Battery-$NEW_VERSION-arm64.dmg" \
  --title "AION Battery Optimizer v$NEW_VERSION" \
  --notes "## What's New
This is an automated release for version **v$NEW_VERSION**.

### Installation Instructions
1. Download the \`AION Battery-$NEW_VERSION-arm64.dmg\` file from Assets below.
2. Double-click the downloaded \`.dmg\` file.
3. Drag and drop **AION Battery** into your Applications folder.

*(If you bypass Apple's security prompt, right-click the app and press Open)*"

echo "✅ Successfully released AION Battery v$NEW_VERSION to GitHub!"
